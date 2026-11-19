import { getErrorMessage } from "adapter";
import { Client } from "client";
import { scopeKey } from "request";

/**
 * A failed request waits `retryTime` before it is sent again. While it waits it is not running, so the only way to
 * cancel it is to remove it from the queue - and a removed request must never be sent again.
 */
describe("Dispatcher [ Retry of removed requests ]", () => {
  const createFailingRequest = (options: { retry: number; retryTime: number; cancelable?: boolean }) => {
    const client = new Client({ url: "shared-base-url" });
    const calls: string[] = [];
    const request = client
      .createRequest<{ response: unknown; error: { message: string } }>()({ endpoint: "/retry-removal", ...options })
      .setMock(
        ({ requestId }) => {
          calls.push(requestId);
          return { data: null, error: { message: "Failed" }, status: 500, success: false };
        },
        { requestTime: 0, responseTime: 0 },
      );
    const dispatcher = client.fetchDispatcher;
    const queryKey = scopeKey(request.queryKey, request.scope);
    const abortKey = scopeKey(request.abortKey, request.scope);

    /** Run `action` at the moment the request failed and started waiting for its retry. */
    const onWaitingForRetry = (action: (requestId: string) => void) => {
      let done = false;
      client.requestManager.events.onResponse(({ details, requestId }) => {
        if (details.willRetry && !done) {
          done = true;
          action(requestId);
        }
      });
    };

    return { client, request, calls, dispatcher, queryKey, abortKey, onWaitingForRetry };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should keep retrying a request that stays in the queue", async () => {
    const { request, calls } = createFailingRequest({ retry: 3, retryTime: 50 });

    const sent = request.send();
    await vi.advanceTimersByTimeAsync(2000);
    const response = await sent;

    expect(calls).toHaveLength(4);
    expect(new Set(calls).size).toBe(1);
    expect(response.error).toEqual({ message: "Failed" });
  });

  it("should not retry a request deleted while it waits for its retry", async () => {
    const { request, calls, dispatcher, queryKey, abortKey, onWaitingForRetry } = createFailingRequest({
      retry: 3,
      retryTime: 50,
    });
    onWaitingForRetry((requestId) => dispatcher.delete(queryKey, requestId, abortKey));

    const sent = request.send();
    await vi.advanceTimersByTimeAsync(2000);
    const response = await sent;

    expect(calls).toHaveLength(1);
    expect(response.success).toBe(false);
    expect(response.error).toEqual(getErrorMessage("deleted"));
    expect(dispatcher.getQueue(queryKey).requests).toHaveLength(0);
    expect(dispatcher.getRunningRequests(queryKey)).toHaveLength(0);
  });

  it("should not retry a request deleted on a later attempt", async () => {
    const { client, request, calls, dispatcher, queryKey, abortKey } = createFailingRequest({
      retry: 5,
      retryTime: 50,
    });
    client.requestManager.events.onResponse(({ details, requestId }) => {
      if (details.willRetry && details.retries === 2) {
        dispatcher.delete(queryKey, requestId, abortKey);
      }
    });

    const sent = request.send();
    await vi.advanceTimersByTimeAsync(5000);
    await sent;

    expect(calls).toHaveLength(3);
    expect(dispatcher.getQueue(queryKey).requests).toHaveLength(0);
  });

  it("should resolve the send promise when the request is deleted between two attempts", async () => {
    const { request, calls, dispatcher, queryKey, abortKey } = createFailingRequest({ retry: 3, retryTime: 500 });
    const onRemove = vi.fn();
    let requestId = "";

    const sent = request.send({
      onBeforeSent: (data) => {
        requestId = data.requestId;
      },
      onRemove,
    });
    // The first attempt failed, the retry is scheduled half a second later
    await vi.advanceTimersByTimeAsync(200);
    expect(calls).toHaveLength(1);
    dispatcher.delete(queryKey, requestId, abortKey);
    const response = await sent;
    await vi.advanceTimersByTimeAsync(2000);

    expect(response.success).toBe(false);
    expect(response.error).toEqual(getErrorMessage("deleted"));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(1);
  });

  it("should resolve the send promise when the request is deleted while it waits for the network", async () => {
    const { client, request, calls, dispatcher, queryKey, abortKey } = createFailingRequest({
      retry: 0,
      retryTime: 0,
    });
    client.appManager.setOnline(false);
    let requestId = "";

    const sent = request.send({
      onBeforeSent: (data) => {
        requestId = data.requestId;
      },
    });
    await vi.advanceTimersByTimeAsync(200);
    expect(calls).toHaveLength(0);
    dispatcher.delete(queryKey, requestId, abortKey);
    const response = await sent;
    client.appManager.setOnline(true);
    await vi.advanceTimersByTimeAsync(2000);

    expect(response.error).toEqual(getErrorMessage("deleted"));
    expect(calls).toHaveLength(0);
  });

  it("should not retry a request when its queue is cleared while it waits", async () => {
    const { request, calls, dispatcher, queryKey, onWaitingForRetry } = createFailingRequest({
      retry: 3,
      retryTime: 50,
    });
    onWaitingForRetry(() => dispatcher.clearQueue(queryKey));

    request.send();
    await vi.advanceTimersByTimeAsync(2000);

    expect(calls).toHaveLength(1);
    expect(dispatcher.getRunningRequests(queryKey)).toHaveLength(0);
  });

  it("should not retry a cancelable request replaced by a newer one while it waits", async () => {
    const { request, calls, dispatcher, onWaitingForRetry } = createFailingRequest({
      retry: 1,
      retryTime: 50,
      cancelable: true,
    });
    let secondId = "";
    onWaitingForRetry(() => {
      secondId = dispatcher.add(request);
    });

    const firstId = dispatcher.add(request);
    await vi.advanceTimersByTimeAsync(2000);

    // The first one was sent once and replaced; only the second one used its retry
    expect(calls.filter((requestId) => requestId === firstId)).toHaveLength(1);
    expect(calls.filter((requestId) => requestId === secondId)).toHaveLength(2);
    expect(calls).toHaveLength(3);
  });

  it("should not send a request again when it is deleted and the network comes back", async () => {
    const { client, request, calls, dispatcher, queryKey, abortKey, onWaitingForRetry } = createFailingRequest({
      retry: 3,
      retryTime: 50,
    });
    onWaitingForRetry((requestId) => {
      client.appManager.setOnline(false);
      dispatcher.delete(queryKey, requestId, abortKey);
    });

    request.send();
    await vi.advanceTimersByTimeAsync(500);
    client.appManager.setOnline(true);
    await vi.advanceTimersByTimeAsync(2000);

    expect(calls).toHaveLength(1);
  });
});
