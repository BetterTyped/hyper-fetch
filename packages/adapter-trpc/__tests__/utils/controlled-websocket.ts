/**
 * A WebSocket stand-in that does nothing on its own - the test plays the tRPC server and decides when the connection
 * opens, which messages arrive and when (and how) it closes. There are no timers and no network inside, so every
 * scenario is deterministic and can be combined with fake timers freely.
 *
 * It follows the browser behaviour that matters for the adapter:
 * - `close()` on a connection that is still CONNECTING fails it with `error` + `close` (code 1006)
 * - `close()` on an OPEN connection ends with a clean `close` carrying the requested code
 * - `send()` throws while the connection is not OPEN
 */
export class ControlledWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  /** Every instance created since the last `reset()`, in creation order */
  static instances: ControlledWebSocket[] = [];
  /** When set, the next constructor call throws it - like an invalid url does in the browser */
  static constructorError: Error | null = null;

  static reset() {
    ControlledWebSocket.instances = [];
    ControlledWebSocket.constructorError = null;
  }

  static get last(): ControlledWebSocket {
    const instance = ControlledWebSocket.instances.at(-1);
    if (!instance) {
      throw new Error("[ControlledWebSocket] No WebSocket was created");
    }
    return instance;
  }

  /** Instances that are connecting or open - "how many live connections does the client hold" */
  static get active(): ControlledWebSocket[] {
    return ControlledWebSocket.instances.filter(
      (instance) =>
        instance.readyState === ControlledWebSocket.CONNECTING || instance.readyState === ControlledWebSocket.OPEN,
    );
  }

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState: number = ControlledWebSocket.CONNECTING;
  /** Frames passed to `send`, in order */
  sent: string[] = [];
  /** Arguments of client-side `close()` calls */
  closeCalls: { code?: number; reason?: string }[] = [];

  constructor(
    public url: string,
    public protocols?: string | string[],
  ) {
    super();
    if (ControlledWebSocket.constructorError) {
      const error = ControlledWebSocket.constructorError;
      ControlledWebSocket.constructorError = null;
      throw error;
    }
    ControlledWebSocket.instances.push(this);
  }

  send(frame: string) {
    if (this.readyState !== ControlledWebSocket.OPEN) {
      throw new Error("[ControlledWebSocket] Cannot send - the connection is not open");
    }
    this.sent.push(frame);
  }

  close(code?: number, reason?: string) {
    this.closeCalls.push({ code, reason });
    if (this.readyState === ControlledWebSocket.CLOSING || this.readyState === ControlledWebSocket.CLOSED) {
      return;
    }
    const wasConnecting = this.readyState === ControlledWebSocket.CONNECTING;
    this.readyState = ControlledWebSocket.CLOSED;
    // Closing before the handshake finished fails the connection (1006), otherwise the close is clean
    if (wasConnecting) {
      this.dispatchEvent(new Event("error"));
      this.dispatchEvent(new CloseEvent("close", { code: 1006, reason: "", wasClean: false }));
      return;
    }
    this.dispatchEvent(new CloseEvent("close", { code: code ?? 1005, reason: reason ?? "", wasClean: true }));
  }

  // Server side - driven by the test

  /** The server accepts the connection */
  serverOpen() {
    if (this.readyState !== ControlledWebSocket.CONNECTING) {
      throw new Error("[ControlledWebSocket] Only a connecting socket can be opened");
    }
    this.readyState = ControlledWebSocket.OPEN;
    this.dispatchEvent(new Event("open"));
  }

  /** The server sends a raw frame */
  serverSend(data: unknown) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }

  /** The server sends a JSON message */
  serverMessage(message: unknown) {
    this.serverSend(JSON.stringify(message));
  }

  /** The server answers the subscription with the given request id */
  serverResult(id: number, result: Record<string, unknown>) {
    this.serverMessage({ id, result });
  }

  /**
   * The handshake fails the way Node.js 22 reports it: an `error` event and no `close` - the socket stays CONNECTING.
   * Browsers and newer Node.js versions always follow the error with a close event.
   */
  serverRefuseWithoutClose() {
    this.dispatchEvent(new Event("error"));
  }

  /** The server (or the network) closes the connection */
  serverClose({
    code = 1006,
    reason = "",
    wasClean = false,
  }: { code?: number; reason?: string; wasClean?: boolean } = {}) {
    if (this.readyState === ControlledWebSocket.CLOSED) {
      return;
    }
    this.readyState = ControlledWebSocket.CLOSED;
    this.dispatchEvent(new CloseEvent("close", { code, reason, wasClean }));
  }

  /** JSON messages sent by the client, without the `PING` / `PONG` keep-alive frames */
  get messages(): Record<string, any>[] {
    return this.sent.filter((frame) => frame !== "PING" && frame !== "PONG").map((frame) => JSON.parse(frame));
  }

  /** Subscription requests sent by the client */
  get subscriptions(): { id: number; method: "subscription"; params: Record<string, unknown> }[] {
    return this.messages.filter((message) => message.method === "subscription") as never;
  }

  /** Ids of the subscriptions stopped by the client */
  get stopped(): number[] {
    return this.messages.filter((message) => message.method === "subscription.stop").map(({ id }) => id);
  }
}

let originalWebSocket: typeof WebSocket | undefined;

/**
 * Replaces the global WebSocket with {@link ControlledWebSocket} for the current test.
 * Call `uninstallControlledWebSocket` in `afterEach`.
 */
export const installControlledWebSocket = () => {
  ControlledWebSocket.reset();
  originalWebSocket ??= globalThis.WebSocket;
  globalThis.WebSocket = ControlledWebSocket as unknown as typeof WebSocket;
  return ControlledWebSocket;
};

export const uninstallControlledWebSocket = () => {
  if (originalWebSocket) {
    globalThis.WebSocket = originalWebSocket;
    originalWebSocket = undefined;
  }
  ControlledWebSocket.reset();
};

/** Lets pending promise callbacks run - the adapter prepares every connection attempt asynchronously */
export const flushPromises = async (rounds = 10) => {
  for (let i = 0; i < rounds; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
};

/**
 * Waits (promise ticks only) until the client created its `count`-th WebSocket and returns it.
 * Defaults to "the next one that is not created yet".
 */
export const waitForWebSocket = async (count = ControlledWebSocket.instances.length + 1) => {
  for (let i = 0; i < 100 && ControlledWebSocket.instances.length < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
  const instance = ControlledWebSocket.instances[count - 1];
  if (!instance) {
    throw new Error(
      `[ControlledWebSocket] Expected ${count} WebSocket(s), got ${ControlledWebSocket.instances.length}`,
    );
  }
  return instance;
};

/** Waits for the WebSocket of a socket that is connecting right now and accepts it on the server side */
export const openWebSocket = async (count = Math.max(ControlledWebSocket.instances.length, 1)) => {
  const instance = await waitForWebSocket(count);
  instance.serverOpen();
  await flushPromises();
  return instance;
};
