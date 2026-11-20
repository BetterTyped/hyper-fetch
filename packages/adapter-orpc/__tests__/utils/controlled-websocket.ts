/**
 * A WebSocket stand-in that does nothing on its own - the test plays the oRPC server and decides when the
 * connection opens, which messages arrive and when it closes. No timers and no network inside.
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

  /** Every instance created since the last `install`, in creation order */
  static instances: ControlledWebSocket[] = [];
  /** When set, the next constructor call throws it - like an invalid url does in the browser */
  static constructorError: Error | null = null;

  static get last(): ControlledWebSocket {
    const instance = ControlledWebSocket.instances.at(-1);
    if (!instance) {
      throw new Error("[ControlledWebSocket] No WebSocket was created");
    }
    return instance;
  }

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState: number = ControlledWebSocket.CONNECTING;
  binaryType: BinaryType = "blob";
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
    this.readyState = ControlledWebSocket.OPEN;
    this.dispatchEvent(new Event("open"));
  }

  /** The server sends a raw frame */
  serverSend(data: unknown) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }

  /** The server sends a message of the oRPC peer protocol */
  serverMessage(message: unknown) {
    this.serverSend(JSON.stringify(message));
  }

  /** The server answers a request with the event iterator headers - the subscription runs */
  serverStartIterator(id: string) {
    this.serverMessage({ i: id, p: { h: { "content-type": "text/event-stream" } } });
  }

  /** The server sends an event of the iterator, `data` is the already serialized `{ json, meta }` value */
  serverEvent(id: string, { event = "message", data, meta }: { event?: string; data?: unknown; meta?: unknown }) {
    this.serverMessage({ i: id, t: 3, p: { e: event, d: data, m: meta } });
  }

  /**
   * The handshake fails the way Node.js 22 reports it: an `error` event and no `close` - the socket stays CONNECTING.
   * Browsers and newer Node.js versions always follow the error with a close event.
   */
  serverRefuseWithoutClose() {
    this.dispatchEvent(new Event("error"));
  }

  /** The server (or the network) closes the connection */
  serverClose({ code = 1006, reason = "" }: { code?: number; reason?: string } = {}) {
    this.readyState = ControlledWebSocket.CLOSED;
    this.dispatchEvent(new CloseEvent("close", { code, reason, wasClean: code === 1000 }));
  }

  /** Frames sent by the client, parsed */
  get messages(): { i: string; t?: number; p?: { u: string; b: unknown; h?: Record<string, string> } }[] {
    return this.sent.map((frame) => JSON.parse(frame));
  }

  /** Request messages sent by the client */
  get requests() {
    return this.messages.filter((message) => message.t === undefined);
  }

  /** Ids of the requests the client aborted */
  get aborts() {
    return this.messages.filter((message) => message.t === 4).map((message) => message.i);
  }
}

/** Replaces the global WebSocket for the current test. Call `vi.unstubAllGlobals()` in `afterEach`. */
export const installControlledWebSocket = () => {
  ControlledWebSocket.instances = [];
  ControlledWebSocket.constructorError = null;
  vi.stubGlobal("WebSocket", ControlledWebSocket);
  return ControlledWebSocket;
};
