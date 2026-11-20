/**
 * An EventSource stand-in driven entirely by the test, which plays the tRPC server - no network and no timers inside.
 *
 * It follows the browser behaviour that matters for the adapter:
 * - named events (`connected`, `ping`, `serialized-error`, `return`) and unnamed `message` events are dispatched to
 *   `addEventListener` listeners, with `lastEventId` set from the `id` field
 * - a dropped connection fires `error` with `readyState` CONNECTING (the browser retries on its own)
 * - a fatal failure (bad status, wrong content type) fires `error` with `readyState` CLOSED (no retry)
 * - `close()` is silent - it fires no event
 */
export class ControlledEventSource extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  /** Every instance created since the last `reset()`, in creation order */
  static instances: ControlledEventSource[] = [];
  /** When set, the next constructor call throws it - like an invalid url does in the browser */
  static constructorError: Error | null = null;

  static reset() {
    ControlledEventSource.instances = [];
    ControlledEventSource.constructorError = null;
  }

  static get last(): ControlledEventSource {
    const instance = ControlledEventSource.instances.at(-1);
    if (!instance) {
      throw new Error("[ControlledEventSource] No EventSource was created");
    }
    return instance;
  }

  /** Instances that are connecting or open - "how many streams does the client hold" */
  static get active(): ControlledEventSource[] {
    return ControlledEventSource.instances.filter((instance) => instance.readyState !== ControlledEventSource.CLOSED);
  }

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;

  readyState: number = ControlledEventSource.CONNECTING;
  closeCalls = 0;
  /** The `id` of the last event with one - sent back as `Last-Event-ID` when the browser reconnects */
  lastEventId = "";

  constructor(
    public url: string,
    public eventSourceInit?: EventSourceInit,
  ) {
    super();
    if (ControlledEventSource.constructorError) {
      const error = ControlledEventSource.constructorError;
      ControlledEventSource.constructorError = null;
      throw error;
    }
    ControlledEventSource.instances.push(this);
  }

  close() {
    this.closeCalls += 1;
    this.readyState = ControlledEventSource.CLOSED;
  }

  /** Query params of the stream url */
  get params(): URLSearchParams {
    return new URL(this.url).searchParams;
  }

  // Server side - driven by the test

  /** The server accepts the stream and sends the tRPC `connected` event */
  serverOpen(options: Record<string, unknown> = {}) {
    this.readyState = ControlledEventSource.OPEN;
    this.dispatchEvent(new Event("open"));
    this.serverEvent("connected", JSON.stringify(options));
  }

  /** The server sends a named event with raw `data` */
  serverEvent(type: string, data: string, id?: string) {
    if (id !== undefined) {
      this.lastEventId = id;
    }
    this.dispatchEvent(new MessageEvent(type, { data, lastEventId: this.lastEventId }));
  }

  /** The server sends an unnamed message with the JSON `data` - tracked events pass their id */
  serverData(data: unknown, id?: string) {
    // Events without an id reset it, the server restores it with a `restore-id` event afterwards
    this.serverEvent("message", JSON.stringify(data), id ?? "");
  }

  /** The server sends the `serialized-error` event */
  serverError(shape: unknown) {
    this.serverEvent("serialized-error", JSON.stringify(shape));
  }

  /** The connection drops - the browser keeps the source and retries on its own */
  serverDrop() {
    this.readyState = ControlledEventSource.CONNECTING;
    this.dispatchEvent(new Event("error"));
  }

  /** The connection fails for good (e.g. HTTP 500) - the browser gives up */
  serverFail() {
    this.readyState = ControlledEventSource.CLOSED;
    this.dispatchEvent(new Event("error"));
  }
}

let originalEventSource: typeof EventSource | undefined;

/**
 * Replaces the global EventSource with {@link ControlledEventSource} for the current test.
 * Call `uninstallControlledEventSource` in `afterEach`.
 */
export const installControlledEventSource = () => {
  ControlledEventSource.reset();
  originalEventSource ??= globalThis.EventSource;
  globalThis.EventSource = ControlledEventSource as unknown as typeof EventSource;
  return ControlledEventSource;
};

export const uninstallControlledEventSource = () => {
  if (originalEventSource) {
    globalThis.EventSource = originalEventSource;
    originalEventSource = undefined;
  }
  ControlledEventSource.reset();
};
