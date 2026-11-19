/**
 * An EventSource stand-in driven entirely by the test - no network and no timers inside.
 *
 * It follows the browser behaviour that matters for the adapter:
 * - events are dispatched to `addEventListener` listeners (the way a real EventSource does)
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

  /** Instances that are connecting or open - "how many live connections does the client hold" */
  static get active(): ControlledEventSource[] {
    return ControlledEventSource.instances.filter((instance) => instance.readyState !== ControlledEventSource.CLOSED);
  }

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;

  readyState: number = ControlledEventSource.CONNECTING;
  withCredentials: boolean;
  closeCalls = 0;

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
    this.withCredentials = Boolean(eventSourceInit?.withCredentials);
    ControlledEventSource.instances.push(this);
  }

  close() {
    this.closeCalls += 1;
    this.readyState = ControlledEventSource.CLOSED;
  }

  // Server side - driven by the test

  /** The server accepts the stream */
  serverOpen() {
    this.readyState = ControlledEventSource.OPEN;
    this.dispatchEvent(new Event("open"));
  }

  /** The server sends an unnamed message with raw `data` */
  serverSend(data: unknown, init: { lastEventId?: string; origin?: string } = {}) {
    this.dispatchEvent(new MessageEvent("message", { data, ...init }));
  }

  /** The server sends a `{ topic, data }` message in the default wire format */
  serverEmit(topic: string, data: unknown, init: { lastEventId?: string } = {}) {
    this.serverSend(JSON.stringify({ topic, data }), init);
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
  originalEventSource ??= window.EventSource;
  window.EventSource = ControlledEventSource as unknown as typeof EventSource;
  return ControlledEventSource;
};

export const uninstallControlledEventSource = () => {
  if (originalEventSource) {
    window.EventSource = originalEventSource;
    originalEventSource = undefined;
  }
  ControlledEventSource.reset();
};

/** Lets pending promise callbacks run - the adapter prepares every connection attempt asynchronously */
const flush = async (rounds = 10) => {
  for (let i = 0; i < rounds; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
};

/**
 * Waits (promise ticks only) until the client created its `count`-th EventSource and returns it.
 * Defaults to "the next one that is not created yet".
 */
export const waitForEventSource = async (count = ControlledEventSource.instances.length + 1) => {
  for (let i = 0; i < 100 && ControlledEventSource.instances.length < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
  const instance = ControlledEventSource.instances[count - 1];
  if (!instance) {
    throw new Error(
      `[ControlledEventSource] Expected ${count} EventSource(s), got ${ControlledEventSource.instances.length}`,
    );
  }
  return instance;
};

/** Waits for the EventSource of a socket that is connecting right now and accepts it on the server side */
export const openEventSource = async (count = Math.max(ControlledEventSource.instances.length, 1)) => {
  const instance = await waitForEventSource(count);
  instance.serverOpen();
  await flush();
  return instance;
};
