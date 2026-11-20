/**
 * A `fetch` stand-in driven by the test - the test plays the server and decides when the response comes, what the
 * event stream sends and when it ends. No network and no timers inside, so it combines with fake timers freely.
 *
 * It follows the fetch behaviour that matters for the adapter:
 * - aborting the signal before the response rejects the call with an `AbortError`
 * - aborting the signal after the response errors the body stream, the pending read rejects
 */
export class ControlledStreamCall {
  /** Chunks pushed to the body, as the text the server wrote */
  written: string[] = [];
  /** `true` once the client aborted the call, before or after the response */
  aborted = false;
  responded = false;

  private resolveResponse: (response: Response) => void = () => {};
  private rejectResponse: (error: unknown) => void = () => {};
  private streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
  private encoder = new TextEncoder();

  readonly response: Promise<Response>;

  constructor(
    public url: string,
    public init: RequestInit,
  ) {
    this.response = new Promise<Response>((resolve, reject) => {
      this.resolveResponse = resolve;
      this.rejectResponse = reject;
    });

    const { signal } = init;
    signal?.addEventListener("abort", () => {
      this.aborted = true;
      const error = new DOMException("This operation was aborted", "AbortError");
      if (!this.responded) {
        this.rejectResponse(error);
        return;
      }
      try {
        this.streamController?.error(error);
      } catch {
        // The stream is closed already
      }
    });
  }

  get headers(): Record<string, string> {
    return { ...(this.init.headers as Record<string, string>) };
  }

  /** The parsed JSON body - the serialized `{ json, meta }` input */
  get body(): unknown {
    return JSON.parse(this.init.body as string);
  }

  /** The server answers with an event stream, the test writes to it with `write` */
  open({ status = 200, headers = {} }: { status?: number; headers?: Record<string, string> } = {}) {
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.streamController = controller;
      },
    });
    this.responded = true;
    this.resolveResponse(
      new Response(stream, { status, headers: { "content-type": "text/event-stream", ...headers } }),
    );
  }

  /** The server answers with a regular response */
  respond({
    status = 200,
    body = "",
    headers = { "content-type": "application/json" },
  }: {
    status?: number;
    body?: string | null;
    headers?: Record<string, string>;
  } = {}) {
    this.responded = true;
    this.resolveResponse(new Response(body, { status, headers }));
  }

  /** The network fails before the response */
  fail(error: unknown = new TypeError("fetch failed")) {
    this.rejectResponse(error);
  }

  /** The server writes raw text to the event stream */
  write(text: string) {
    this.written.push(text);
    this.writeBytes(this.encoder.encode(text));
  }

  /** The server writes raw bytes, e.g. half of a multi-byte character. Writes after the client aborted are lost. */
  writeBytes(bytes: Uint8Array) {
    if (!this.aborted) {
      this.streamController?.enqueue(bytes);
    }
  }

  /** The server sends one event in the oRPC format, `data` is the already serialized `{ json, meta }` value */
  send({ event = "message", data, id, retry }: { event?: string; data?: unknown; id?: string; retry?: number }) {
    let text = `event: ${event}\n`;
    if (retry !== undefined) {
      text += `retry: ${retry}\n`;
    }
    if (id !== undefined) {
      text += `id: ${id}\n`;
    }
    if (data !== undefined) {
      text += `data: ${JSON.stringify(data)}\n`;
    }
    this.write(`${text}\n`);
  }

  /** The server ends the stream */
  close() {
    this.streamController?.close();
  }

  /** The connection breaks in the middle of the stream */
  break(error: unknown = new TypeError("terminated")) {
    this.streamController?.error(error);
  }
}

export const createControlledFetch = () => {
  const calls: ControlledStreamCall[] = [];

  const spy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const call = new ControlledStreamCall(String(input), init ?? {});
    calls.push(call);
    return call.response;
  });

  /** Calls that were not aborted - "how many streams does the client hold" */
  const active = () => calls.filter((call) => !call.aborted);

  const last = () => {
    const call = calls.at(-1);
    if (!call) {
      throw new Error("[ControlledFetch] No call was made");
    }
    return call;
  };

  return { calls, active, last, spy };
};

/** Lets pending promise callbacks run - reading a stream takes many promise ticks */
export const flushPromises = async (rounds = 20) => {
  for (let i = 0; i < rounds; i += 1) {
    // Real timers stay untouched, only the microtask queue is drained
    // eslint-disable-next-line no-await-in-loop
    await new Promise<void>((resolve) => {
      queueMicrotask(resolve);
    });
  }
};
