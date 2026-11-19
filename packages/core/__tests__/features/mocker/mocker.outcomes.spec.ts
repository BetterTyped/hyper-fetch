import { createControlledClient, flushPromises, isPending } from "../../utils/controlled-adapter.utils";

describe("Mocker [ Outcomes ]", () => {
  const fast = { requestTime: 0, responseTime: 0 };

  const setup = () => {
    const { client, calls } = createControlledClient();
    const request = client.createRequest<{ response: any; error: any; payload: any }>()({
      endpoint: "/mocked",
      method: "POST",
    });
    /** Send and let the timers of the mocker pass */
    const run = async <T>(sent: Promise<T>, time = 1000) => {
      await vi.advanceTimersByTimeAsync(time);
      return sent;
    };

    return { client, calls, request, run };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("When deciding if the mocked response is a success", () => {
    it.each([
      ["data only", { data: { id: 1 }, status: 200 }, true],
      ["falsy data", { data: 0, status: 200 }, true],
      ["an empty string as data", { data: "", status: 200 }, true],
      ["null data without an error", { data: null, status: 204 }, true],
      ["an error only", { error: { message: "Bad" }, status: 400 }, false],
      ["null data with an error", { data: null, error: { message: "Bad" }, status: 500 }, false],
      ["data together with an error", { data: { id: 1 }, error: { message: "Partial" }, status: 200 }, true],
      ["data marked as a failure", { data: { id: 1 }, status: 400, success: false }, false],
      ["an error marked as a failure", { error: { message: "Bad" }, status: 400, success: false }, false],
      ["an error marked as a success", { error: { message: "Bad" }, status: 200, success: true }, true],
    ] as const)("should treat %s accordingly", async (_, mock, success) => {
      const { request, run } = setup();

      const response = await run(request.setMock(() => mock as never, fast).send());

      expect(response.success).toBe(success);
      expect(response.status).toBe(mock.status);
    });

    it("should give the error of a failed mock without the data", async () => {
      const { request, run } = setup();
      request.setMock(() => ({ error: { message: "Bad" }, status: 400 }), fast);

      const response = await run(request.send());

      expect(response).toMatchObject({ data: null, error: { message: "Bad" }, status: 400, success: false });
    });

    it("should retry a mock which gives only an error", async () => {
      const { request, run } = setup();
      const mock = vi.fn(() => ({ error: { message: "Bad" }, status: 500 }));

      await run(request.setRetry(2).setRetryTime(10).setMock(mock, fast).send());

      expect(mock).toHaveBeenCalledTimes(3);
    });

    it("should give both the data and the error of a partial response", async () => {
      const { request, run } = setup();
      request.setMock(() => ({ data: { id: 1 }, error: { message: "Partial" }, status: 200 }), fast);

      const response = await run(request.send());

      expect(response).toMatchObject({ data: { id: 1 }, error: { message: "Partial" }, success: true });
    });

    it("should use the default extra of the adapter and the one given by the mock", async () => {
      const { request, run } = setup();

      const withDefault = await run(request.setMock(() => ({ data: 1, status: 200 }), fast).send());
      const withOwn = await run(
        request.setMock(() => ({ data: 1, status: 200, extra: { headers: { "x-mock": "1" } } }), fast).send(),
      );

      expect(withDefault.extra).toEqual({ headers: {} });
      expect(withOwn.extra).toEqual({ headers: { "x-mock": "1" } });
    });
  });

  describe("When the mock function is called", () => {
    it("should receive the request with the values of the call", async () => {
      const { client, run } = setup();
      const request = client.createRequest<{ response: any; payload: any }>()({
        endpoint: "/mocked/:id",
        method: "POST",
      });
      const mock = vi.fn(() => ({ data: null, status: 200 }));
      request.setMock(mock, fast);

      await run(request.send({ params: { id: 7 }, payload: { name: "John" } }));
      const [{ request: mocked, requestId }] = mock.mock.calls[0] as unknown as [{ request: any; requestId: string }];

      expect(mocked.endpoint).toBe("/mocked/7");
      expect(mocked.params).toEqual({ id: 7 });
      expect(mocked.payload).toEqual({ name: "John" });
      expect(requestId).toEqual(expect.any(String));
    });

    it("should wait for an async mock", async () => {
      const { request, run } = setup();
      request.setMock(async () => ({ data: "async", status: 200 }), fast);

      await expect(run(request.send())).resolves.toHaveProperty("data", "async");
    });

    it.each([
      [
        "throws",
        () => {
          throw new Error("Broken mock");
        },
      ],
      [
        "rejects",
        async () => {
          throw new Error("Broken mock");
        },
      ],
    ])("should give the error when the mock %s", async (_, mock) => {
      const { request, run, client } = setup();

      const response = await run(request.setMock(mock as never, fast).send());

      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
      expect(response.error.message).toBe("Broken mock");
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });

    it("should not call the real adapter", async () => {
      const { request, run, calls } = setup();

      await run(request.setMock(() => ({ data: 1, status: 200 }), fast).send());

      expect(calls).toHaveLength(0);
    });

    it("should be used by exec too", async () => {
      const { request, run } = setup();

      const response = await run(request.setMock(() => ({ data: "exec", status: 200 }), fast).exec({}));

      expect(response.data).toBe("exec");
    });
  });

  describe("When mocking is switched off", () => {
    it("should use the real adapter for a request with the disabled mock", async () => {
      const { request, calls } = setup();
      request.setMock(() => ({ data: "mock", status: 200 }), fast).setMockingEnabled(false);

      const sent = request.send();
      await flushPromises();
      await calls[0].succeed("real");

      await expect(sent).resolves.toHaveProperty("data", "real");
    });

    it("should use the mock again after enabling it", async () => {
      const { request, run } = setup();
      request.setMock(() => ({ data: "mock", status: 200 }), fast).setMockingEnabled(false);
      request.setMockingEnabled(true);

      await expect(run(request.send())).resolves.toHaveProperty("data", "mock");
    });

    it("should use the real adapter after clearing the mock", async () => {
      const { request, calls } = setup();
      request.setMock(() => ({ data: "mock", status: 200 }), fast).clearMock();

      const sent = request.send();
      await flushPromises();
      await calls[0].succeed("real");

      await expect(sent).resolves.toHaveProperty("data", "real");
    });

    it("should use the real adapter when mocking is disabled for the whole client", async () => {
      const { client, request, calls } = setup();
      request.setMock(() => ({ data: "mock", status: 200 }), fast);
      client.setEnableGlobalMocking(false);

      const sent = request.send();
      await flushPromises();
      await calls[0].succeed("real");

      await expect(sent).resolves.toHaveProperty("data", "real");
    });
  });

  describe("When the mock takes time", () => {
    it("should answer after the request and the response time", async () => {
      const { request } = setup();
      request.setMock(() => ({ data: 1, status: 200 }), { requestTime: 100, responseTime: 200 });

      const sent = request.send();
      await vi.advanceTimersByTimeAsync(299);
      expect(await isPending(sent)).toBe(true);
      await vi.advanceTimersByTimeAsync(1);

      await expect(sent).resolves.toHaveProperty("data", 1);
    });

    it("should report the whole upload and download", async () => {
      const { request, run } = setup();
      const upload: number[] = [];
      const download: number[] = [];
      request.setMock(() => ({ data: 1, status: 200 }), {
        requestTime: 60,
        responseTime: 60,
        totalUploaded: 300,
        totalDownloaded: 900,
      });

      await run(
        request.send({
          onUploadProgress: ({ loaded }) => upload.push(loaded),
          onDownloadProgress: ({ loaded }) => download.push(loaded),
        }),
      );

      expect(upload.at(-1)).toBe(300);
      expect(download.at(-1)).toBe(900);
      expect(upload).toEqual(upload.toSorted((a, b) => a - b));
      expect(download).toEqual(download.toSorted((a, b) => a - b));
    });

    it("should call the lifecycle callbacks in order", async () => {
      const { request, run } = setup();
      const order: string[] = [];
      request.setMock(() => ({ data: 1, status: 200 }), fast);

      await run(
        request.send({
          onBeforeSent: () => order.push("onBeforeSent"),
          onRequestStart: () => order.push("onRequestStart"),
          onResponseStart: () => order.push("onResponseStart"),
          onResponse: () => order.push("onResponse"),
        }),
      );

      expect(order).toEqual(["onBeforeSent", "onRequestStart", "onResponseStart", "onResponse"]);
    });

    it("should give the abort error and stop reporting the progress after an abort", async () => {
      const { request, run } = setup();
      const onUploadProgress = vi.fn();
      const onResponseStart = vi.fn();
      request.setMock(() => ({ data: 1, status: 200 }), { requestTime: 1000, responseTime: 1000 });

      const sent = request.send({ onUploadProgress, onResponseStart });
      await vi.advanceTimersByTimeAsync(100);
      request.abort();
      const callsBeforeAbort = onUploadProgress.mock.calls.length;
      const response = await run(sent, 5000);

      expect(response.error.message).toBe("Request aborted");
      expect(onUploadProgress).toHaveBeenCalledTimes(callsBeforeAbort);
      expect(onResponseStart).not.toHaveBeenCalled();
    });

    it("should give one response for an aborted mock", async () => {
      const { client, request, run } = setup();
      const onResponse = vi.fn();
      client.requestManager.events.onResponse(onResponse);
      request.setMock(() => ({ data: 1, status: 200 }), { requestTime: 100, responseTime: 100 });

      const sent = request.send();
      await vi.advanceTimersByTimeAsync(50);
      request.abort();
      await run(sent, 5000);

      expect(onResponse).toHaveBeenCalledTimes(1);
    });

    it("should give the timeout error when the mock is slower than its timeout", async () => {
      const { request, run } = setup();
      request.setMock(() => ({ data: 1, status: 200 }), { requestTime: 500, responseTime: 500, timeout: 300 });

      const response = await run(request.send(), 5000);

      expect(response.success).toBe(false);
      expect(response.error.message).toBe("Request timeout");
    });

    it("should give the response when the mock is faster than its timeout", async () => {
      const { client, request, run } = setup();
      const onResponse = vi.fn();
      client.requestManager.events.onResponse(onResponse);
      request.setMock(() => ({ data: 1, status: 200 }), { requestTime: 20, responseTime: 20, timeout: 300 });

      const response = await run(request.send(), 5000);

      expect(response.data).toBe(1);
      expect(onResponse).toHaveBeenCalledTimes(1);
    });
  });
});
