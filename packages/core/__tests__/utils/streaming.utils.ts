import { Adapter } from "adapter";
import type { AdapterFetcherType, AdapterInstance } from "adapter";
import { Client } from "client";
import http from "http";
import type { AddressInfo, Socket } from "net";

/** What a test can write as a part of the response body. */
export type BodyChunk = string | Uint8Array | Buffer;

/**
 * One request received by the stream server. The test decides when the status line, every body chunk and the end
 * of the response are written, so nothing depends on timing.
 */
export type StreamExchange = {
  method: string;
  path: string;
  headers: http.IncomingHttpHeaders;
  /** Request payload */
  body: Buffer;
  /** Send the status line and headers. Chunked transfer encoding is used unless `Content-Length` is given. */
  head: (status?: number, headers?: Record<string, string>) => void;
  /** Write one body chunk. Resolves once it has been handed to the socket. */
  write: (chunk: BodyChunk) => Promise<void>;
  /** Finish the response, optionally with a last chunk. */
  end: (chunk?: BodyChunk) => Promise<void>;
  /** Kill the socket without finishing the body - a network failure in the middle of the stream. */
  destroy: () => void;
  /** Resolves when the response is over: finished by the server or dropped by the client. */
  closed: Promise<void>;
  isClosed: () => boolean;
  /** True once the server ended the response (or the response is over for another reason). */
  isFinished: () => boolean;
  /** True when the connection went away before the server finished the response. */
  wasDropped: () => boolean;
};

/**
 * Real HTTP server on an ephemeral port where every response is driven step by step by the test.
 */
export const createStreamServer = () => {
  let server: http.Server | null = null;
  const sockets = new Set<Socket>();
  const queued: StreamExchange[] = [];
  const waiters: ((exchange: StreamExchange) => void)[] = [];
  const exchanges: StreamExchange[] = [];

  const handle = (req: http.IncomingMessage, res: http.ServerResponse, body: Buffer) => {
    let closed = false;
    let dropped = false;
    let resolveClosed: () => void = () => {};
    const closedPromise = new Promise<void>((resolve) => {
      resolveClosed = resolve;
    });
    res.on("close", () => {
      closed = true;
      dropped = !res.writableFinished;
      resolveClosed();
    });

    const exchange: StreamExchange = {
      method: req.method || "GET",
      path: req.url || "/",
      headers: req.headers,
      body,
      head: (status, headers) => {
        res.writeHead(status ?? 200, headers ?? { "Content-Type": "text/plain; charset=utf-8" });
        // Push the status line out right away, so the client gets the headers before any body chunk
        res.flushHeaders();
      },
      write: (chunk) =>
        new Promise<void>((resolve, reject) => {
          if (!res.headersSent) {
            exchange.head();
          }
          res.write(chunk, (error) => (error ? reject(error) : resolve()));
        }),
      end: (chunk) =>
        new Promise<void>((resolve) => {
          if (!res.headersSent) {
            exchange.head();
          }
          if (chunk === undefined) {
            res.end(() => resolve());
          } else {
            res.end(chunk, () => resolve());
          }
        }),
      destroy: () => {
        res.destroy();
      },
      closed: closedPromise,
      isClosed: () => closed,
      isFinished: () => closed || res.writableEnded,
      wasDropped: () => dropped,
    };

    exchanges.push(exchange);
    const waiter = waiters.shift();
    if (waiter) {
      waiter(exchange);
    } else {
      queued.push(exchange);
    }
  };

  const start = (): Promise<string> =>
    new Promise((resolve, reject) => {
      server = http.createServer((req, res) => {
        const parts: Uint8Array[] = [];
        req.on("data", (part: Buffer) => parts.push(new Uint8Array(part)));
        req.on("end", () => handle(req, res, Buffer.concat(parts)));
      });
      server.on("connection", (socket) => {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
      });
      server.on("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const { port } = server!.address() as AddressInfo;
        resolve(`http://127.0.0.1:${port}`);
      });
    });

  const stop = (): Promise<void> =>
    new Promise((resolve) => {
      if (!server) {
        resolve();
        return;
      }
      sockets.forEach((socket) => socket.destroy());
      server.close(() => {
        server = null;
        resolve();
      });
    });

  /** The next request that reached the server (in arrival order). Waits for it when none arrived yet. */
  const next = (): Promise<StreamExchange> => {
    const exchange = queued.shift();
    if (exchange) {
      return Promise.resolve(exchange);
    }
    return new Promise((resolve) => {
      waiters.push(resolve);
    });
  };

  /**
   * Forget everything from the previous test. Responses the test left unfinished are dropped.
   * A finished response is left alone even when its "close" event did not fire yet: its connection is kept alive
   * and may be picked for the next request, so destroying it here would randomly break the next test.
   */
  const reset = () => {
    exchanges.forEach((exchange) => {
      if (!exchange.isFinished()) {
        exchange.destroy();
      }
    });
    exchanges.length = 0;
    queued.length = 0;
    waiters.length = 0;
  };

  return { start, stop, next, reset, exchanges };
};

/**
 * Wait for a condition without polling: `until` re-checks the predicate every time `notify` is called.
 */
export const createSignal = () => {
  const pending: { predicate: () => boolean; resolve: () => void }[] = [];

  const notify = () => {
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      if (pending[i].predicate()) {
        const [{ resolve }] = pending.splice(i, 1);
        resolve();
      }
    }
  };

  const until = (predicate: () => boolean): Promise<void> => {
    if (predicate()) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      pending.push({ predicate, resolve });
    });
  };

  return { notify, until };
};

export type RecordedChunk = { text: string; bytes: number[]; index: number; loaded: number };

/**
 * Collects response-chunk events and lets the test wait until a given number of bytes or chunks arrived.
 */
export const createChunkRecorder = () => {
  const signal = createSignal();
  const chunks: RecordedChunk[] = [];

  const record = ({
    chunk,
    text,
    index,
    loaded,
  }: {
    chunk: Uint8Array;
    text: string;
    index: number;
    loaded: number;
  }) => {
    chunks.push({ text, bytes: [...chunk], index, loaded });
    signal.notify();
  };

  return {
    chunks,
    record,
    text: () => chunks.map((chunk) => chunk.text).join(""),
    bytes: () => chunks.flatMap((chunk) => chunk.bytes),
    loaded: () => chunks.at(-1)?.loaded ?? 0,
    /** Resolves once at least `bytes` bytes of the current response were delivered */
    untilLoaded: (bytes: number) => signal.until(() => (chunks.at(-1)?.loaded ?? 0) >= bytes),
    /** Resolves once at least `count` chunk events were delivered */
    untilCount: (count: number) => signal.until(() => chunks.length >= count),
  };
};

/** A promise resolved from the outside. */
export const createDeferred = <T = void>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

export const byteLength = (value: string) => Buffer.byteLength(value, "utf8");

/** Bytes written as space separated hexadecimal pairs: `hex("f0 9f")`. */
export const hex = (value: string) => Uint8Array.from(value.split(" "), (byte) => parseInt(byte, 16));

/** Byte by byte comparison that does not care which kind of byte array it gets. */
export const sameBytes = (left: ArrayLike<number>, right: ArrayLike<number>) => {
  if (left.length !== right.length) {
    return false;
  }
  for (let position = 0; position < left.length; position += 1) {
    if (left[position] !== right[position]) {
      return false;
    }
  }
  return true;
};

type FetcherBindings = Parameters<AdapterFetcherType<AdapterInstance>>[0];

/**
 * One call of the controlled adapter's fetcher. The test plays the role of the transport: it reports the request
 * lifecycle, the chunks and the result through the adapter bindings whenever it wants.
 */
export type ControlledCall = {
  bindings: FetcherBindings;
  requestId: string;
  /** True once the request was aborted (the place where a real transport closes its connection) */
  isAborted: () => boolean;
  /** Resolves when the request was aborted */
  aborted: Promise<void>;
  /** Report the request as sent and the response as started */
  open: () => void;
  /** Report one body chunk */
  chunk: (value: string | Uint8Array) => void;
  /** Report the end of the body and resolve with success */
  succeed: (data: unknown, status?: number) => void;
  /** Resolve with an error */
  fail: (error: unknown, status?: number) => void;
};

export type ControlledAdapterOptions = { streaming?: boolean; timeout?: number };

/**
 * Client with an adapter whose every request is driven by the test through the adapter bindings.
 * It is the smallest possible "custom adapter" using the streaming bindings, without any transport.
 */
export const createControlledClient = (url = "http://controlled") => {
  const queued: ControlledCall[] = [];
  const waiters: ((call: ControlledCall) => void)[] = [];
  const calls: ControlledCall[] = [];

  const adapter = new Adapter<ControlledAdapterOptions, "GET" | "POST", number, Record<string, any>>({
    name: "controlled",
    defaultMethod: "GET",
    defaultExtra: {},
    systemErrorStatus: 0,
    systemErrorExtra: {},
  }).setFetcher(async (bindings) => {
    let isAborted = false;
    const aborted = createDeferred();
    const unmountAbortListener = bindings.createAbortListener({
      status: 0,
      extra: {},
      onAbort: () => {
        isAborted = true;
        aborted.resolve();
      },
    });

    const call: ControlledCall = {
      bindings: bindings as unknown as FetcherBindings,
      requestId: bindings.requestId,
      isAborted: () => isAborted,
      aborted: aborted.promise,
      open: () => {
        bindings.onBeforeRequest();
        bindings.onRequestStart();
        bindings.onRequestEnd();
        bindings.onResponseStart();
      },
      chunk: (value) => {
        bindings.onResponseChunk(value);
      },
      succeed: (data, status = 200) => {
        bindings.onResponseEnd();
        unmountAbortListener();
        bindings.onSuccess({ data, status, extra: {} });
      },
      fail: (error, status = 500) => {
        unmountAbortListener();
        bindings.onError({ error, status, extra: {} });
      },
    };

    calls.push(call);
    const waiter = waiters.shift();
    if (waiter) {
      waiter(call);
    } else {
      queued.push(call);
    }
  });

  const client = new Client({ url }).setAdapter(adapter);

  /** The next fetcher call (in order). Waits for it when the adapter was not called yet. */
  const next = (): Promise<ControlledCall> => {
    const call = queued.shift();
    if (call) {
      return Promise.resolve(call);
    }
    return new Promise((resolve) => {
      waiters.push(resolve);
    });
  };

  return { client, adapter, calls, next };
};
