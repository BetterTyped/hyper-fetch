import { AbortError, Client } from "../../../src";

describe("Mocker [ Chunks ]", () => {
  let client = new Client({ url: "http://mocked" });

  beforeEach(() => {
    client = new Client({ url: "http://mocked" });
  });

  const fastConfig = { requestTime: 0, responseTime: 0 };

  it("should emit mocked chunks before resolving and join them into the data", async () => {
    const request = client
      .createRequest<{ response: string }>()({ endpoint: "/stream" })
      .setMock(() => ({ chunks: ["data: a\n\n", new TextEncoder().encode("data: b\n\n")], status: 200 }), fastConfig);

    const order: string[] = [];
    const response = await request.send({
      onResponseChunk: ({ text, index }) => order.push(`${index}:${text}`),
      onResponse: () => order.push("response"),
    });

    expect(order).toEqual(["0:data: a\n\n", "1:data: b\n\n", "response"]);
    expect(response.data).toBe("data: a\n\ndata: b\n\n");
    expect(response.success).toBe(true);
  });

  it("should parse joined chunks as JSON when possible", async () => {
    const request = client
      .createRequest<{ response: { ok: boolean } }>()({ endpoint: "/json" })
      .setMock(() => ({ chunks: ['{"ok"', ":true}"], status: 200 }), fastConfig);

    const { data } = await request.send();
    expect(data).toEqual({ ok: true });
  });

  it("should prefer explicit data over joined chunks", async () => {
    const request = client
      .createRequest<{ response: string }>()({ endpoint: "/explicit" })
      .setMock(() => ({ chunks: ["a", "b"], data: "final", status: 200 }), fastConfig);

    const { data } = await request.send();
    expect(data).toBe("final");
  });

  it("should wait chunkTime before each chunk", async () => {
    vi.useFakeTimers();
    try {
      const request = client
        .createRequest<{ response: string }>()({ endpoint: "/slow" })
        .setMock(() => ({ chunks: ["a", "b"], status: 200 }), { ...fastConfig, chunkTime: 100 });

      const texts: string[] = [];
      const promise = request.send({ onResponseChunk: ({ text }) => texts.push(text) });

      // Request/response progress simulation runs first - step until the first chunk lands
      let elapsed = 0;
      while (texts.length === 0 && elapsed < 1000) {
        // eslint-disable-next-line no-await-in-loop
        await vi.advanceTimersByTimeAsync(1);
        elapsed += 1;
      }
      expect(texts).toEqual(["a"]);
      expect(elapsed).toBeGreaterThanOrEqual(100);

      await vi.advanceTimersByTimeAsync(99);
      expect(texts).toEqual(["a"]);
      await vi.advanceTimersByTimeAsync(1);
      expect(texts).toEqual(["a", "b"]);
      await vi.runAllTimersAsync();
      await expect(promise).resolves.toMatchObject({ data: "ab" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("should stop emitting chunks when aborted", async () => {
    const request = client
      .createRequest<{ response: string }>()({ endpoint: "/abort" })
      .setMock(() => ({ chunks: ["a", "b", "c"], status: 200 }), { ...fastConfig, chunkTime: 5 });

    const texts: string[] = [];
    const { error } = await request.send({
      onResponseChunk: ({ text }) => {
        texts.push(text);
        request.abort();
      },
    });

    expect(texts).toEqual(["a"]);
    expect(error).toBeInstanceOf(AbortError);
  });
});
