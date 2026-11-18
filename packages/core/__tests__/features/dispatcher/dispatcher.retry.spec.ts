import { getErrorMessage } from "adapter";
import { Client } from "client";

describe("Dispatcher [ Retry ]", () => {
  const retryTime = 1000;

  const createResponse = (success: boolean) => ({
    data: success ? { ok: true } : null,
    error: success ? null : new Error("Request failed"),
    status: success ? 200 : 500,
    success,
    extra: {},
    requestTimestamp: Date.now(),
    responseTimestamp: Date.now(),
  });

  const deletedResponse = expect.objectContaining({ success: false, error: getErrorMessage("deleted") });

  let client = new Client({ url: "shared-base-url" });
  let dispatcher = client.fetchDispatcher;
  let fetchSpy = vi.spyOn(client.adapter, "fetch");

  /**
   * Sends the request and stops right after the first failure, with the retry timer pending
   */
  const startRetryWait = async (options?: { retry?: number; cancelable?: boolean }) => {
    const request = client.createRequest()({ endpoint: "/retry", retry: 1, retryTime, ...options });
    const onSettled = vi.fn();
    request.send().then(onSettled);

    await vi.advanceTimersByTimeAsync(0);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [{ requestId }] = dispatcher.getQueue(request.queryKey).requests;

    return { request, requestId, queryKey: request.queryKey, onSettled };
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    client = new Client({ url: "shared-base-url" });
    dispatcher = client.fetchDispatcher;
    fetchSpy = vi.spyOn(client.adapter, "fetch").mockImplementation((async () => createResponse(false)) as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("When the request is removed while waiting for the retry", () => {
    it("should not send the retry after deleting the request", async () => {
      const { request, requestId, queryKey, onSettled } = await startRetryWait();

      dispatcher.delete(queryKey, requestId, request.abortKey);
      await vi.advanceTimersByTimeAsync(retryTime * 2);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(onSettled).toHaveBeenCalledExactlyOnceWith(deletedResponse);
    });

    it("should not leave the retry timer behind after deleting the request", async () => {
      const { request, requestId, queryKey } = await startRetryWait();

      dispatcher.delete(queryKey, requestId, request.abortKey);

      expect(vi.getTimerCount()).toBe(0);
    });

    it("should announce the deleted request only once", async () => {
      const onRemove = vi.fn();
      client.requestManager.events.onRemove(onRemove);
      const { request, requestId, queryKey } = await startRetryWait();

      dispatcher.delete(queryKey, requestId, request.abortKey);
      await vi.advanceTimersByTimeAsync(retryTime * 2);

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it("should not send the retry and settle the request after clearing its queue", async () => {
      const onRemove = vi.fn();
      client.requestManager.events.onRemove(onRemove);
      const { requestId, queryKey, onSettled } = await startRetryWait();

      dispatcher.clearQueue(queryKey);
      await vi.advanceTimersByTimeAsync(0);

      expect(onSettled).toHaveBeenCalledExactlyOnceWith(deletedResponse);

      await vi.advanceTimersByTimeAsync(retryTime * 2);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ requestId }));
    });

    it("should not send the retry and settle the request after clearing the dispatcher", async () => {
      const onRemove = vi.fn();
      client.requestManager.events.onRemove(onRemove);
      const { requestId, onSettled } = await startRetryWait();

      dispatcher.clear();
      await vi.advanceTimersByTimeAsync(0);

      expect(onSettled).toHaveBeenCalledExactlyOnceWith(deletedResponse);

      await vi.advanceTimersByTimeAsync(retryTime * 2);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ requestId }));
    });

    it("should not send the retry of a request replaced by a cancelable one", async () => {
      const { request, onSettled } = await startRetryWait({ cancelable: true });
      fetchSpy.mockImplementationOnce((async () => createResponse(true)) as never);

      const replacement = request.clone();
      const onReplacementSettled = vi.fn();
      replacement.send().then(onReplacementSettled);
      await vi.advanceTimersByTimeAsync(retryTime * 2);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(onSettled).toHaveBeenCalledExactlyOnceWith(deletedResponse);
      expect(onReplacementSettled).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ success: true }));
    });

    it("should not send the retry when the request disappeared from the storage", async () => {
      const onRemove = vi.fn();
      client.requestManager.events.onRemove(onRemove);
      const { requestId, queryKey, onSettled } = await startRetryWait();

      dispatcher.storage.delete(queryKey);
      await vi.advanceTimersByTimeAsync(retryTime * 2);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(onSettled).toHaveBeenCalledExactlyOnceWith(deletedResponse);
      expect(onRemove).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ requestId }));
    });
  });

  describe("When the request stays in the queue while waiting for the retry", () => {
    it("should send the retry once the retry time passes", async () => {
      const { onSettled } = await startRetryWait();
      fetchSpy.mockImplementationOnce((async () => createResponse(true)) as never);

      await vi.advanceTimersByTimeAsync(retryTime - 1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(onSettled).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ success: true }));
    });

    it("should use all of the available retries and remove the request afterwards", async () => {
      const { queryKey, onSettled } = await startRetryWait({ retry: 2 });

      await vi.advanceTimersByTimeAsync(retryTime * 2);

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(dispatcher.getQueue(queryKey).requests).toHaveLength(0);
      expect(onSettled).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ success: false }));
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should send the retry when the queue gets paused during the wait", async () => {
      const { queryKey, onSettled } = await startRetryWait();
      fetchSpy.mockImplementationOnce((async () => createResponse(true)) as never);

      dispatcher.pause(queryKey);
      await vi.advanceTimersByTimeAsync(retryTime);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(onSettled).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ success: true }));
    });

    it("should send the retry when the queue gets stopped during the wait", async () => {
      const { queryKey, onSettled } = await startRetryWait();
      fetchSpy.mockImplementationOnce((async () => createResponse(true)) as never);

      dispatcher.stop(queryKey);
      await vi.advanceTimersByTimeAsync(retryTime);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(onSettled).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ success: true }));
    });

    it("should hold the retry of a stopped request until it gets started again", async () => {
      const { requestId, queryKey, onSettled } = await startRetryWait();
      fetchSpy.mockImplementationOnce((async () => createResponse(true)) as never);

      dispatcher.stopRequest(queryKey, requestId);
      await vi.advanceTimersByTimeAsync(retryTime * 2);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(dispatcher.getRequest(queryKey, requestId)).toBeDefined();
      expect(onSettled).not.toHaveBeenCalled();

      dispatcher.startRequest(queryKey, requestId);
      await vi.advanceTimersByTimeAsync(0);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(onSettled).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ success: true }));
    });

    it("should keep a single retry timer when the queue is flushed during the wait", async () => {
      const { queryKey } = await startRetryWait();

      dispatcher.start(queryKey);
      await vi.advanceTimersByTimeAsync(0);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(1);

      await vi.advanceTimersByTimeAsync(retryTime * 2);

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(dispatcher.getQueue(queryKey).requests).toHaveLength(0);
    });
  });
});
