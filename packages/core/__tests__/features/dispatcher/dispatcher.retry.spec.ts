import type { ResponseDetailsType } from "managers";

import { createControlledClient, flushPromises, isPending } from "../../utils/controlled-adapter.utils";

/**
 * Retries are counted per request. Nothing that happens around a request waiting for its next attempt - another
 * request in the same queue, the network coming back, the queue being paused - may give it more attempts, send it
 * earlier than `retryTime` or let it be sent twice.
 */
describe("Dispatcher [ Retry ]", () => {
  const setup = (options: {
    retry?: number;
    retryTime?: number;
    queued?: boolean;
    offline?: boolean;
    method?: "GET" | "POST";
  }) => {
    const { client, calls, getPending } = createControlledClient();
    const request = client.createRequest<{ response: { ok: boolean }; error: { message: string } }>()({
      endpoint: "/retry",
      method: "POST",
      ...options,
    });
    const dispatcher = client.submitDispatcher;
    const details: ResponseDetailsType[] = [];
    client.requestManager.events.onResponse((event) => details.push(event.details));

    return { client, calls, getPending, request, dispatcher, details };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("When counting the attempts", () => {
    it("should not retry by default", async () => {
      const { request, calls } = setup({});

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(1);
      expect(response.success).toBe(false);
    });

    it.each([1, 2, 5])("should send a failing request %i more times and then give the last error", async (retry) => {
      const { request, calls } = setup({ retry, retryTime: 100 });

      const sent = request.send();
      for (let attempt = 0; attempt <= retry; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        await vi.advanceTimersByTimeAsync(100);
        // eslint-disable-next-line no-await-in-loop
        await calls[attempt].fail({ message: `Attempt ${attempt}` });
      }
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(retry + 1);
      expect(response.error).toEqual({ message: `Attempt ${retry}` });
      expect(response.success).toBe(false);
    });

    it("should stop retrying after the first success", async () => {
      const { request, calls } = setup({ retry: 5, retryTime: 100 });

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[1].succeed({ ok: true });
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(2);
      expect(response.data).toEqual({ ok: true });
      expect(response.success).toBe(true);
    });

    it("should keep the same requestId for every attempt", async () => {
      const { request, calls } = setup({ retry: 2, retryTime: 100 });

      request.send();
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[1].fail();
      await vi.advanceTimersByTimeAsync(100);

      expect(calls).toHaveLength(3);
      expect(new Set(calls.map((call) => call.requestId)).size).toBe(1);
    });

    it("should report the attempt number and the retry plan with every response", async () => {
      const { request, calls, details } = setup({ retry: 2, retryTime: 100 });

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[1].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[2].fail();
      await sent;

      expect(details.map(({ retries, willRetry }) => ({ retries, willRetry }))).toEqual([
        { retries: 0, willRetry: true },
        { retries: 1, willRetry: true },
        { retries: 2, willRetry: false },
      ]);
    });

    it("should mark only the repeated attempts as retries in the loading events", async () => {
      const { client, request, calls } = setup({ retry: 1, retryTime: 100 });
      const loading: { loading: boolean; isRetry: boolean }[] = [];
      client.requestManager.events.onLoading((event) =>
        loading.push({ loading: event.loading, isRetry: event.isRetry }),
      );

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[1].fail();
      await sent;

      expect(loading).toEqual([
        { loading: true, isRetry: false },
        { loading: false, isRetry: false },
        { loading: true, isRetry: true },
        { loading: false, isRetry: true },
      ]);
    });

    it("should count the retries of every request on its own", async () => {
      const { request, calls } = setup({ retry: 1, retryTime: 100 });

      const first = request.send();
      const second = request.send();
      await flushPromises();
      await calls[0].fail({ message: "first" });
      await calls[1].fail({ message: "second" });
      await vi.advanceTimersByTimeAsync(100);
      expect(calls).toHaveLength(4);
      await calls[2].fail({ message: "first again" });
      await calls[3].succeed({ ok: true });
      const responses = await Promise.all([first, second]);
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(4);
      expect(responses[0].error).toEqual({ message: "first again" });
      expect(responses[1].data).toEqual({ ok: true });
    });
  });

  describe("When waiting for the next attempt", () => {
    it("should wait the whole retryTime before sending again", async () => {
      const { request, calls } = setup({ retry: 1, retryTime: 1000 });

      request.send();
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(999);
      expect(calls).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(calls).toHaveLength(2);
    });

    it("should retry right away when retryTime is zero", async () => {
      const { request, calls } = setup({ retry: 1, retryTime: 0 });

      request.send();
      await flushPromises();
      await calls[0].fail();
      await flushPromises();

      expect(calls).toHaveLength(2);
    });

    it("should keep the send promise pending between the attempts", async () => {
      const { request, calls } = setup({ retry: 1, retryTime: 1000 });
      const onResponse = vi.fn();

      const sent = request.send({ onResponse });
      await flushPromises();
      await calls[0].fail();

      expect(await isPending(sent)).toBe(true);
      expect(onResponse).not.toHaveBeenCalled();
    });

    it("should not send the waiting request earlier when another one joins its queue", async () => {
      const { request, calls } = setup({ retry: 1, retryTime: 1000 });

      const first = request.send();
      await flushPromises();
      await calls[0].fail();
      // The second request shares the queue with the one waiting for its retry
      const second = request.send();
      await flushPromises();

      expect(calls).toHaveLength(2);
      expect(calls[1].requestId).not.toBe(calls[0].requestId);

      await calls[1].succeed();
      await vi.advanceTimersByTimeAsync(1000);
      expect(calls).toHaveLength(3);
      expect(calls[2].requestId).toBe(calls[0].requestId);
      await calls[2].fail();
      await Promise.all([first, second]);
      await vi.advanceTimersByTimeAsync(60_000);

      // One attempt and one retry for the first request, one attempt for the second
      expect(calls).toHaveLength(3);
    });

    it("should not give more attempts when the queue is flushed in the meantime", async () => {
      const { request, calls, dispatcher } = setup({ retry: 2, retryTime: 1000 });

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      dispatcher.flush();
      dispatcher.flushQueue(request.queryKey);
      await flushPromises();
      expect(calls).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(1000);
      await calls[1].fail();
      dispatcher.flush();
      await vi.advanceTimersByTimeAsync(1000);
      await calls[2].fail();
      await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(3);
    });

    it("should keep the number of used attempts on the queued request", async () => {
      const { request, calls, dispatcher } = setup({ retry: 3, retryTime: 1000 });

      request.send();
      await flushPromises();
      expect(dispatcher.getQueue(request.queryKey).requests[0].retries).toBe(0);
      await calls[0].fail();
      expect(dispatcher.getQueue(request.queryKey).requests[0].retries).toBe(1);
      await vi.advanceTimersByTimeAsync(1000);
      await calls[1].fail();

      expect(dispatcher.getQueue(request.queryKey).requests[0].retries).toBe(2);
    });
  });

  describe("When the retryOnError callback is set", () => {
    it("should retry as long as the callback agrees", async () => {
      const { request, calls } = setup({ retry: 5, retryTime: 100 });
      const retryOnError = vi.fn((response: { status: number | null }) => response.status === 503);

      const sent = request.setRetryOnError(retryOnError).send();
      await flushPromises();
      await calls[0].fail({ message: "Unavailable" }, 503);
      await vi.advanceTimersByTimeAsync(100);
      await calls[1].fail({ message: "Bad request" }, 400);
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(2);
      expect(response.status).toBe(400);
      expect(retryOnError).toHaveBeenCalledTimes(2);
    });

    it("should not ask the callback about a successful response", async () => {
      const { request, calls } = setup({ retry: 5, retryTime: 100 });
      const retryOnError = vi.fn(() => true);

      const sent = request.setRetryOnError(retryOnError).send();
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expect(retryOnError).not.toHaveBeenCalled();
    });

    it("should not ask the callback when there are no attempts left", async () => {
      const { request, calls } = setup({ retry: 1, retryTime: 100 });
      const retryOnError = vi.fn(() => true);

      const sent = request.setRetryOnError(retryOnError).send();
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[1].fail();
      await sent;

      expect(retryOnError).toHaveBeenCalledTimes(1);
    });

    it("should give the error response instead of hanging when the callback throws", async () => {
      const { request, calls, dispatcher } = setup({ retry: 3, retryTime: 100 });

      const sent = request
        .setRetryOnError(() => {
          throw new Error("Broken callback");
        })
        .send();
      await flushPromises();
      await calls[0].fail({ message: "Server error" });
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(1);
      expect(response.error).toEqual({ message: "Server error" });
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });
  });

  describe("When the queue is paused or stopped while a request waits for its retry", () => {
    it("should not retry while the queue is paused", async () => {
      const { request, calls, dispatcher } = setup({ retry: 2, retryTime: 100 });

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      dispatcher.pause(request.queryKey);
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(1);
      expect(await isPending(sent)).toBe(true);
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(1);
    });

    it("should continue from the same attempt when the paused queue is started", async () => {
      const { request, calls, dispatcher, details } = setup({ retry: 2, retryTime: 100 });

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      dispatcher.pause(request.queryKey);
      await vi.advanceTimersByTimeAsync(60_000);
      dispatcher.start(request.queryKey);
      await flushPromises();
      expect(calls).toHaveLength(2);
      await calls[1].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[2].fail();
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(3);
      expect(details.map(({ retries }) => retries)).toEqual([0, 1, 2]);
      expect(response.success).toBe(false);
    });

    it("should not retry a request stopped while it waits", async () => {
      const { request, calls, dispatcher } = setup({ retry: 2, retryTime: 100 });

      request.send();
      await flushPromises();
      await calls[0].fail();
      dispatcher.stopRequest(request.queryKey, calls[0].requestId);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(calls).toHaveLength(1);

      dispatcher.startRequest(request.queryKey, calls[0].requestId);
      await flushPromises();

      expect(calls).toHaveLength(2);
    });
  });

  describe("When the connection is lost around a retry", () => {
    it("should not use an attempt for a failure caused by going offline", async () => {
      const { client, request, calls, details } = setup({ retry: 1, retryTime: 100 });

      const sent = request.send();
      await flushPromises();
      client.appManager.setOnline(false);
      await calls[0].fail({ message: "Network error" }, 0);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(calls).toHaveLength(1);
      expect(await isPending(sent)).toBe(true);

      client.appManager.setOnline(true);
      await flushPromises();
      expect(calls).toHaveLength(2);
      await calls[1].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[2].succeed();
      const response = await sent;

      expect(response.success).toBe(true);
      expect(details.map(({ retries, isOffline }) => ({ retries, isOffline }))).toEqual([
        { retries: 0, isOffline: true },
        { retries: 0, isOffline: false },
        { retries: 1, isOffline: false },
      ]);
    });

    it("should hold the retry until the connection is back", async () => {
      const { client, request, calls } = setup({ retry: 1, retryTime: 100 });

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      client.appManager.setOnline(false);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(calls).toHaveLength(1);

      client.appManager.setOnline(true);
      await flushPromises();
      expect(calls).toHaveLength(2);
      await calls[1].fail();
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      // The retry was the last attempt - coming back online did not reset the count
      expect(calls).toHaveLength(2);
      expect(response.success).toBe(false);
    });

    it("should not send the waiting request twice when the connection flickers", async () => {
      const { client, request, calls } = setup({ retry: 1, retryTime: 1000 });

      request.send();
      await flushPromises();
      await calls[0].fail();
      client.appManager.setOnline(false);
      client.appManager.setOnline(true);
      await flushPromises();
      expect(calls).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1000);

      expect(calls).toHaveLength(2);
    });
  });

  describe("When requests are queued one by one", () => {
    it("should wait retryTime and respect the retry count", async () => {
      const { request, calls, dispatcher } = setup({ queued: true, retry: 2, retryTime: 1000 });

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(999);
      expect(calls).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(calls).toHaveLength(2);
      await calls[1].fail();
      await vi.advanceTimersByTimeAsync(1000);
      await calls[2].fail({ message: "Last" });
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(3);
      expect(response.error).toEqual({ message: "Last" });
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });

    it("should not let the next request jump ahead of the one waiting for its retry", async () => {
      const { request, calls } = setup({ queued: true, retry: 1, retryTime: 1000 });

      request.send({ payload: "first" } as never);
      request.send({ payload: "second" } as never);
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(999);
      expect(calls).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(calls).toHaveLength(2);
      expect(calls[1].request.payload).toBe("first");
    });

    it("should continue with the next request after the retried one succeeds", async () => {
      const { request, calls } = setup({ queued: true, retry: 1, retryTime: 100 });

      const first = request.send({ payload: "first" } as never);
      const second = request.send({ payload: "second" } as never);
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[1].succeed({ ok: true });
      await flushPromises();
      expect(calls).toHaveLength(3);
      expect(calls[2].request.payload).toBe("second");
      await calls[2].succeed({ ok: true });
      const responses = await Promise.all([first, second]);

      expect(responses.map((response) => response.success)).toEqual([true, true]);
    });

    it("should continue with the next request after the retries are used up", async () => {
      const { request, calls, dispatcher } = setup({ queued: true, retry: 1, retryTime: 100 });

      const first = request.send({ payload: "first" } as never);
      const second = request.send({ payload: "second" } as never);
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[1].fail();
      await flushPromises();
      expect(calls[2].request.payload).toBe("second");
      await calls[2].succeed({ ok: true });
      const responses = await Promise.all([first, second]);
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(3);
      expect(responses.map((response) => response.success)).toEqual([false, true]);
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });
  });

  describe("When the retries are over", () => {
    it("should leave nothing behind", async () => {
      const { client, request, calls, dispatcher } = setup({ retry: 2, retryTime: 100 });

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[1].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[2].fail();
      await sent;

      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      expect(dispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(client.requestManager.abortControllers.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should not retry an aborted request", async () => {
      const { request, calls } = setup({ retry: 3, retryTime: 100 });

      const sent = request.send();
      await flushPromises();
      request.abort();
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(1);
      expect(response.error?.message).toBe("Request aborted");
    });
  });
});
