import { Client } from "client";
import type { RequestRetryEventType } from "managers";
import type { RequestInstance } from "request";

import { getThrownErrors } from "../../utils/fixtures.utils";

describe("Dispatcher [ Retry event ]", () => {
  const createResponse = (status: number) => ({
    data: status < 400 ? { ok: true } : null,
    error: status < 400 ? null : new Error("Request failed"),
    status,
    success: status < 400,
    extra: {},
    requestTimestamp: Date.now(),
    responseTimestamp: Date.now(),
  });

  let client = new Client({ url: "shared-base-url" });
  let statuses: number[] = [];
  let fetchSpy = vi.spyOn(client.adapter, "fetch");

  /** The retry numbers and delays of the received events */
  const summarize = (spy: ReturnType<typeof vi.fn>) =>
    spy.mock.calls.map((args) => {
      const event = args[0] as RequestRetryEventType<RequestInstance>;
      return [event.retry, event.delay];
    });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    client = new Client({ url: "shared-base-url" });
    // Every attempt answers with the next status, the last one repeats
    statuses = [500];
    let attempt = 0;
    fetchSpy = vi
      .spyOn(client.adapter, "fetch")
      .mockImplementation((async () => {
        const status = statuses[Math.min(attempt, statuses.length - 1)];
        attempt += 1;
        return createResponse(status);
      }) as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("When a failed attempt schedules a retry", () => {
    it("should emit the retry number and its delay for every scheduled retry", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 3,
        retryTime: ({ attempt }) => (attempt + 1) * 100,
      });
      const onRetry = vi.fn();
      client.requestManager.events.onRetry(onRetry);

      request.send();
      await vi.advanceTimersByTimeAsync(1000);

      expect(fetchSpy).toHaveBeenCalledTimes(4);
      expect(summarize(onRetry)).toStrictEqual([
        [1, 100],
        [2, 200],
        [3, 300],
      ]);
    });

    it("should give the failed response and its details", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 1,
        retryTime: 0,
      });
      const onRetry = vi.fn();
      client.requestManager.events.onRetry(onRetry);

      request.send();
      await vi.advanceTimersByTimeAsync(0);

      expect(onRetry).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          request: expect.objectContaining({ queryKey: request.queryKey }),
          requestId: expect.any(String),
          response: expect.objectContaining({ status: 500, success: false }),
          details: expect.objectContaining({ retries: 0, willRetry: true }),
          retry: 1,
          delay: 0,
        }),
      );
    });

    it("should emit after the response of the failed attempt and before the next attempt", async () => {
      const order: string[] = [];
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 1,
        retryTime: 100,
      });
      client.requestManager.events.onResponse(() => order.push("response"));
      client.requestManager.events.onRetry(() => order.push("retry"));
      client.requestManager.events.onRequestStart(() => order.push("start"));
      fetchSpy.mockImplementation((async (
        req: RequestInstance,
        requestId: string,
      ) => {
        client.requestManager.events.emitRequestStart({
          request: req,
          requestId,
        });
        return createResponse(500);
      }) as never);

      request.send();
      await vi.advanceTimersByTimeAsync(0);
      expect(order).toStrictEqual(["start", "response", "retry"]);

      await vi.advanceTimersByTimeAsync(100);
      expect(order).toStrictEqual([
        "start",
        "response",
        "retry",
        "start",
        "response",
      ]);
    });

    it("should emit to the listeners of the request id and of the queue", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 1,
        retryTime: 0,
      });
      const onRetryById = vi.fn();
      const onRetryByQueue = vi.fn();
      client.requestManager.events.onRetryByQueue(
        request.queryKey,
        onRetryByQueue,
      );

      const requestId = client.fetchDispatcher.add(request);
      client.requestManager.events.onRetryById(requestId, onRetryById);
      await vi.advanceTimersByTimeAsync(0);

      expect(onRetryById).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ requestId, retry: 1 }),
      );
      expect(onRetryByQueue).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ requestId, retry: 1 }),
      );
    });

    it("should stop calling a listener once it is removed", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 2,
        retryTime: 100,
      });
      const onRetry = vi.fn();
      const unmount = client.requestManager.events.onRetry(onRetry);

      request.send();
      await vi.advanceTimersByTimeAsync(0);
      unmount();
      await vi.advanceTimersByTimeAsync(1000);

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledOnce();
    });

    it("should still retry and rethrow the error outside of the lifecycle when a listener throws", async () => {
      // The thrown errors are reported from a real timer
      vi.useRealTimers();
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 1,
        retryTime: 0,
      });
      const listenerError = new Error("Broken listener");
      client.requestManager.events.onRetry(() => {
        throw listenerError;
      });
      let response: unknown;

      const errors = await getThrownErrors(async () => {
        response = await request.send();
      });

      expect(errors).toStrictEqual([listenerError]);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(response).toStrictEqual(
        expect.objectContaining({ status: 500, success: false }),
      );
    });
  });

  describe("When listening on the request", () => {
    it("should call the onRetry option of send for every retry of this request only", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 2,
        retryTime: 50,
      });
      const otherRequest = client.createRequest()({
        endpoint: "/other",
        retry: 2,
        retryTime: 50,
      });
      const onRetry = vi.fn();
      const onResponse = vi.fn();

      request.send({ onRetry, onResponse });
      otherRequest.send();
      await vi.advanceTimersByTimeAsync(1000);

      expect(fetchSpy).toHaveBeenCalledTimes(6);
      expect(summarize(onRetry)).toStrictEqual([
        [1, 50],
        [2, 50],
      ]);
      // The failed attempts which are retried do not answer send - only the last one does
      expect(onResponse).toHaveBeenCalledOnce();
    });

    it("should call the onRetry hook of the request", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 1,
        retryTime: 0,
      });
      const onRetry = vi.fn();
      const unmount = request.$hooks.onRetry(onRetry);

      request.send();
      await vi.advanceTimersByTimeAsync(0);
      unmount();
      request.send();
      await vi.advanceTimersByTimeAsync(0);

      expect(fetchSpy).toHaveBeenCalledTimes(4);
      expect(summarize(onRetry)).toStrictEqual([[1, 0]]);
    });

    it("should give the mutation context of the optimistic update", async () => {
      const request = client
        .createRequest<{ response: { ok: boolean } }>()({
          endpoint: "/retry",
          method: "POST",
          retry: 1,
          retryTime: 0,
        })
        .setOptimistic(() => ({ context: { previous: 1 } }));
      const onRetry = vi.fn();

      request.send({ onRetry });
      await vi.advanceTimersByTimeAsync(0);

      expect(onRetry).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          retry: 1,
          mutationContext: expect.objectContaining({
            context: { previous: 1 },
          }),
        }),
      );
    });

    it("should type the event of the request", () => {
      const request = client.createRequest<{
        response: { ok: boolean };
        error: { message: string };
      }>()({
        endpoint: "/retry",
      });

      // The hooks of a request are shared by its clones - they are typed for any request
      request.$hooks.onRetry((event) => {
        expectTypeOf(event).toEqualTypeOf<
          RequestRetryEventType<RequestInstance>
        >();
      });
      request.send({
        onRetry: (event) => {
          expectTypeOf(event).toEqualTypeOf<
            RequestRetryEventType<typeof request>
          >();
          expectTypeOf(event.retry).toEqualTypeOf<number>();
          expectTypeOf(event.delay).toEqualTypeOf<number>();
          expectTypeOf(event.response.error).toEqualTypeOf<
            { message: string } | Error | null
          >();
        },
      });
    });
  });

  describe("When no retry is scheduled", () => {
    it("should not emit when the request succeeds", async () => {
      statuses = [200];
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 3,
        retryTime: 0,
      });
      const onRetry = vi.fn();
      client.requestManager.events.onRetry(onRetry);

      await request.send();

      expect(onRetry).not.toHaveBeenCalled();
    });

    it("should not emit once a retry succeeds", async () => {
      statuses = [500, 200];
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 3,
        retryTime: 0,
      });
      const onRetry = vi.fn();
      client.requestManager.events.onRetry(onRetry);

      request.send();
      await vi.advanceTimersByTimeAsync(0);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(summarize(onRetry)).toStrictEqual([[1, 0]]);
    });

    it("should not emit when the request has no retries", async () => {
      const request = client.createRequest()({ endpoint: "/retry", retry: 0 });
      const onRetry = vi.fn();
      client.requestManager.events.onRetry(onRetry);

      await request.send();

      expect(onRetry).not.toHaveBeenCalled();
    });

    it("should not emit when retryOnError rejects the response", async () => {
      const request = client
        .createRequest()({ endpoint: "/retry", retry: 3, retryTime: 0 })
        .setRetryOnError(() => false);
      const onRetry = vi.fn();
      client.requestManager.events.onRetry(onRetry);

      await request.send();

      expect(onRetry).not.toHaveBeenCalled();
    });

    it("should not emit when the retryTime function throws", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 3,
        retryTime: () => {
          throw new Error("Broken delay");
        },
      });
      const onRetry = vi.fn();
      client.requestManager.events.onRetry(onRetry);

      await request.send();

      expect(onRetry).not.toHaveBeenCalled();
    });

    it("should not emit when the request is aborted", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 3,
        retryTime: 0,
      });
      const onRetry = vi.fn();
      client.requestManager.events.onRetry(onRetry);
      fetchSpy.mockImplementation((async () => {
        request.abort();
        return createResponse(500);
      }) as never);

      await request.send();

      expect(onRetry).not.toHaveBeenCalled();
    });

    it("should not emit when the request fails offline", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 3,
        retryTime: 0,
        offline: false,
      });
      const onRetry = vi.fn();
      client.requestManager.events.onRetry(onRetry);
      fetchSpy.mockImplementation((async () => {
        client.appManager.setOnline(false);
        return createResponse(500);
      }) as never);

      await request.send();

      expect(onRetry).not.toHaveBeenCalled();
    });
  });
});
