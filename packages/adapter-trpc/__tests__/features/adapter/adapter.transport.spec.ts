/**
 * @vitest-environment node
 */
import { createClient, getErrorMessage } from "@hyper-fetch/core";

import { TrpcAdapter } from "../../../src/adapter";

const url = "http://localhost:3000/trpc";

const encoder = new TextEncoder();

const jsonHeaders = { "content-type": "application/json" };

const streamOf = (chunks: Uint8Array[]) => {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  });
};

/** Splits the text into single bytes, so every multi-byte character is cut in the middle */
const toSingleBytes = (text: string) => Array.from(encoder.encode(text), (byte) => Uint8Array.of(byte));

/** Fetch that stays pending until the request is aborted, the same way as the real one */
const pendingFetch = (_input: RequestInfo | URL, init?: RequestInit) => {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });
};

describe("Trpc Adapter [ Transport ]", () => {
  let client = createClient({ url }).setAdapter(TrpcAdapter());

  const createQuery = () => client.createRequest<{ response: string }>()({ endpoint: "text" });

  const mockFetch = (response: Response | Record<string, unknown>) => {
    return vi.spyOn(globalThis, "fetch").mockResolvedValue(response as Response);
  };

  beforeEach(() => {
    client = createClient({ url }).setAdapter(TrpcAdapter());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    client.clear();
  });

  describe("when reading the response body", () => {
    it("should decode multi-byte characters split between chunks", async () => {
      const text = "zażółć gęślą jaźń 🎡 日本語";
      const body = JSON.stringify({ result: { data: text } });
      mockFetch(new Response(streamOf(toSingleBytes(body)), { headers: jsonHeaders }));

      const response = await createQuery().send();

      expect(response.data).toBe(text);
    });

    it("should read a body sent in many chunks", async () => {
      const text = "a".repeat(100_000);
      const bytes = encoder.encode(JSON.stringify({ result: { data: text } }));
      const chunks = Array.from({ length: Math.ceil(bytes.length / 1024) }, (_, index) => {
        return bytes.slice(index * 1024, (index + 1) * 1024);
      });
      mockFetch(new Response(streamOf(chunks), { headers: jsonHeaders }));

      const response = await createQuery().send();

      expect(response.data).toBe(text);
    });

    it("should report the progress based on the content length", async () => {
      const bytes = encoder.encode(JSON.stringify({ result: { data: "progress" } }));
      const half = Math.floor(bytes.length / 2);
      const onDownloadProgress = vi.fn();
      mockFetch(
        new Response(streamOf([bytes.slice(0, half), bytes.slice(half)]), {
          headers: { ...jsonHeaders, "content-length": String(bytes.length) },
        }),
      );

      await createQuery().send({ onDownloadProgress });

      expect(onDownloadProgress).toHaveBeenCalledWith(expect.objectContaining({ loaded: half, total: bytes.length }));
      expect(onDownloadProgress).toHaveBeenCalledWith(
        expect.objectContaining({ loaded: bytes.length, total: bytes.length }),
      );
    });

    it("should report the progress without the content length", async () => {
      const bytes = encoder.encode(JSON.stringify({ result: { data: "progress" } }));
      const onDownloadProgress = vi.fn();
      mockFetch(new Response(streamOf([bytes]), { headers: jsonHeaders }));

      await createQuery().send({ onDownloadProgress });

      expect(onDownloadProgress).toHaveBeenCalledWith(
        expect.objectContaining({ loaded: bytes.length, total: bytes.length }),
      );
    });

    it("should read the text when the response has no stream", async () => {
      mockFetch({
        status: 200,
        headers: new Headers(jsonHeaders),
        body: null,
        text: async () => JSON.stringify({ result: { data: "from text" } }),
      });

      const response = await createQuery().send();

      expect(response.data).toBe("from text");
    });

    it("should read the text when the stream has no reader", async () => {
      mockFetch({
        status: 200,
        headers: new Headers(jsonHeaders),
        body: {},
        text: async () => JSON.stringify({ result: { data: "from text" } }),
      });

      const response = await createQuery().send();

      expect(response.data).toBe("from text");
    });

    it("should fail for a response without a body", async () => {
      mockFetch(new Response(null, { status: 204 }));

      const response = await createQuery().send();

      expect(response.data).toBeNull();
      expect(response.error).toStrictEqual(getErrorMessage());
      expect(response.status).toBe(204);
    });

    it("should fail for an empty stream", async () => {
      mockFetch(new Response(streamOf([]), { headers: jsonHeaders }));

      const response = await createQuery().send();

      expect(response.error).toStrictEqual(getErrorMessage());
      expect(response.status).toBe(200);
    });

    it("should fail for a malformed JSON", async () => {
      mockFetch(new Response('{"result":{"data":', { headers: jsonHeaders }));

      const response = await createQuery().send();

      expect(response.error).toStrictEqual(getErrorMessage());
      expect(response.success).toBe(false);
    });

    it("should keep the status and headers when the stream breaks", async () => {
      const failure = new Error("Connection lost");
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('{"result":'));
          controller.error(failure);
        },
      });
      mockFetch(new Response(stream, { status: 200, headers: { "x-request-id": "abc" } }));

      const response = await createQuery().send();

      expect(response.error).toBe(failure);
      expect(response.status).toBe(200);
      expect(response.extra?.headers["x-request-id"]).toBe("abc");
    });

    it("should expose all the response headers", async () => {
      mockFetch(
        new Response(JSON.stringify({ result: { data: "ok" } }), {
          headers: { ...jsonHeaders, "x-first": "1", "x-second": "2" },
        }),
      );

      const response = await createQuery().send();

      expect(response.extra?.headers).toMatchObject({ "x-first": "1", "x-second": "2" });
    });
  });

  describe("when the request is interrupted", () => {
    it("should time out while waiting for the response", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(pendingFetch);

      const response = await createQuery().setOptions({ timeout: 5 }).send();

      expect(response.error).toStrictEqual(getErrorMessage("timeout"));
      expect(response.status).toBe(0);
      expect(response.extra).toStrictEqual({ headers: {} });
    });

    it("should time out while reading the body", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(encoder.encode('{"result":'));
              init?.signal?.addEventListener("abort", () => {
                controller.error(new DOMException("Aborted", "AbortError"));
              });
            },
          }),
        );
      });

      const response = await createQuery().setOptions({ timeout: 5 }).send();

      expect(response.error).toStrictEqual(getErrorMessage("timeout"));
      expect(response.status).toBe(0);
    });

    it("should abort while reading the body", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(encoder.encode('{"result":'));
              init?.signal?.addEventListener("abort", () => {
                controller.error(new DOMException("Aborted", "AbortError"));
              });
            },
          }),
        );
      });

      const request = createQuery();
      const response = await request.send({ onDownloadProgress: () => request.abort() });

      expect(response.error).toStrictEqual(getErrorMessage("abort"));
      expect(response.status).toBe(0);
    });

    it("should use the default timeout of 5 seconds", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      vi.spyOn(globalThis, "fetch").mockImplementation(pendingFetch);
      const onResolved = vi.fn();

      const pending = createQuery().send().then(onResolved);

      await vi.advanceTimersByTimeAsync(4999);
      expect(onResolved).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      await pending;

      expect(onResolved).toHaveBeenCalledWith(
        expect.objectContaining({ error: getErrorMessage("timeout"), status: 0 }),
      );
    });

    it("should not time out when the timeout is disabled", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      let respond: (response: Response) => void = () => null;
      const spy = vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
        return new Promise<Response>((resolve, reject) => {
          respond = resolve;
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        });
      });

      const pending = createQuery().setOptions({ timeout: 0 }).send();

      await vi.advanceTimersByTimeAsync(60_000);
      expect((spy.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(false);

      respond(Response.json({ result: { data: "late" } }));
      const response = await pending;

      expect(response.data).toBe("late");
      expect(response.error).toBeNull();
    });

    it("should clear the timeout after the response has arrived", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const spy = mockFetch(Response.json({ result: { data: "ok" } }));

      const pending = createQuery().setOptions({ timeout: 10 }).send();
      await vi.advanceTimersByTimeAsync(1);
      const response = await pending;
      await vi.advanceTimersByTimeAsync(1000);

      expect(response.data).toBe("ok");
      expect((spy.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(false);
    });

    it("should not report an abort after the response has arrived", async () => {
      mockFetch(Response.json({ result: { data: "ok" } }));
      const request = createQuery();

      const response = await request.send();
      request.abort();

      expect(response.data).toBe("ok");
      expect(response.error).toBeNull();
    });
  });

  describe("when passing the adapter options", () => {
    const getInit = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls[0][1] as RequestInit;

    it("should pass the options to fetch", async () => {
      const spy = mockFetch(Response.json({ result: { data: "ok" } }));

      await createQuery().setOptions({ credentials: "include", cache: "no-store", keepalive: true }).send();

      expect(getInit(spy)).toMatchObject({ credentials: "include", cache: "no-store", keepalive: true });
    });

    it("should not pass the timeout to fetch", async () => {
      const spy = mockFetch(Response.json({ result: { data: "ok" } }));

      await createQuery().setOptions({ timeout: 100 }).send();

      expect(getInit(spy)).not.toHaveProperty("timeout");
    });

    it("should not let the options replace the transport fields", async () => {
      const spy = mockFetch(Response.json({ result: { data: "ok" } }));
      const foreignSignal = new AbortController().signal;

      await createQuery()
        .setOptions({ method: "DELETE", headers: { "x-foreign": "1" }, signal: foreignSignal } as any)
        .send();

      const init = getInit(spy);
      expect(init.method).toBe("GET");
      expect(init.headers).toStrictEqual({});
      expect(init.signal).not.toBe(foreignSignal);
    });
  });
});
