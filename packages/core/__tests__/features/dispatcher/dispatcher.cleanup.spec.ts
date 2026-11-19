import type { ClientInstance } from "client";

import { createControlledClient, flushPromises, isPending } from "../../utils/controlled-adapter.utils";

/**
 * Whatever ends a request - a response, an abort, a removal or a cleared queue - its `send()` promise has to settle
 * and nothing may be left behind: no queue item, no running request, no abort controller, no event listener.
 */
describe("Dispatcher [ Cleanup ]", () => {
  const setup = () => {
    const { client, calls, getPending } = createControlledClient();
    const createRequest = (options: { queued?: boolean; retry?: number; retryTime?: number; endpoint?: string } = {}) =>
      client.createRequest<{ response: unknown; payload: any }>()({
        endpoint: "/cleanup",
        method: "POST",
        ...options,
      });

    return { client, calls, getPending, createRequest, dispatcher: client.submitDispatcher };
  };

  /** Listeners registered for single requests - by their id. The app-wide ones are not counted. */
  const getRequestListenersCount = (client: ClientInstance) => {
    const { emitter } = client.requestManager;
    return emitter
      .eventNames()
      .filter((name) => String(name).includes("-by-id"))
      .reduce((count, name) => count + emitter.listenerCount(name), 0);
  };

  const expectNothingLeft = (client: ClientInstance) => {
    [client.fetchDispatcher, client.submitDispatcher].forEach((dispatcher) => {
      expect(dispatcher.getAllRunningRequests()).toHaveLength(0);
      dispatcher.getQueuesKeys().forEach((queryKey) => {
        expect(dispatcher.getQueue(queryKey).requests).toHaveLength(0);
      });
    });
    expect(client.requestManager.abortControllers.size).toBe(0);
    expect(getRequestListenersCount(client)).toBe(0);
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("When a request ends", () => {
    it("should leave nothing behind after a success", async () => {
      const { client, createRequest, calls } = setup();

      const sent = createRequest().send();
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expectNothingLeft(client);
    });

    it("should leave nothing behind after an error", async () => {
      const { client, createRequest, calls } = setup();

      const sent = createRequest().send();
      await flushPromises();
      await calls[0].fail();
      await sent;

      expectNothingLeft(client);
    });

    it("should leave nothing behind after an abort", async () => {
      const { client, createRequest } = setup();
      const request = createRequest();

      const sent = request.send();
      await flushPromises();
      request.abort();
      await sent;

      expectNothingLeft(client);
    });

    it("should leave nothing behind after a removal", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      const sent = request.send();
      await flushPromises();
      dispatcher.delete(request.queryKey, calls[0].requestId, request.abortKey);
      await sent;
      await flushPromises();

      expectNothingLeft(client);
    });

    it("should leave nothing behind after a deduplicated request", async () => {
      const { client, calls } = setup();
      const request = client.createRequest()({ endpoint: "/cleanup-get" });

      const sent = [request.send(), request.send(), request.send()];
      await flushPromises();
      await calls[0].succeed();
      await Promise.all(sent);

      expectNothingLeft(client);
    });

    it("should leave nothing behind after an exec call", async () => {
      const { client, createRequest, calls } = setup();

      const sent = createRequest().exec({});
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expectNothingLeft(client);
    });

    it("should leave nothing behind after a request with a scope", async () => {
      const { client, createRequest, calls } = setup();

      const sent = createRequest().setScope("session-1").send();
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expectNothingLeft(client);
    });

    it("should not keep a list of running requests for every used queue", async () => {
      const { client, calls, dispatcher } = setup();
      const request = client.createRequest()({ endpoint: "/users/:userId" });
      const onRunning = vi.fn();
      dispatcher.events.onRunningRequestsChange(onRunning);

      const sent = [1, 2, 3].map((userId) => request.send({ params: { userId } }));
      await flushPromises();
      await Promise.all(calls.map((call) => call.succeed()));
      await Promise.all(sent);

      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(client.fetchDispatcher.getRunningRequests(request.setParams({ userId: 1 }).queryKey)).toEqual([]);
    });
  });

  describe("When the queue is cleared", () => {
    it("should resolve the requests which did not start yet", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest({ queued: true });
      const onRemove = vi.fn();

      const running = request.send();
      const waiting = request.send({ onRemove });
      await flushPromises();
      dispatcher.clearQueue(request.queryKey);
      const response = await waiting;

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe("Request deleted");
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(calls).toHaveLength(1);
      expect(await isPending(running)).toBe(true);
    });

    it("should let the running request finish with its own response", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest();
      const onRemove = vi.fn();

      const sent = request.send({ onRemove });
      await flushPromises();
      dispatcher.clearQueue(request.queryKey);
      await calls[0].succeed("finished");

      await expect(sent).resolves.toHaveProperty("data", "finished");
      expect(onRemove).not.toHaveBeenCalled();
      expectNothingLeft(client);
    });

    it("should not send the cleared requests after the running one is done", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest({ queued: true });

      request.send();
      request.send();
      request.send();
      await flushPromises();
      dispatcher.clearQueue(request.queryKey);
      await calls[0].succeed();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(1);
    });

    it("should resolve a request waiting for the network", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest();
      client.appManager.setOnline(false);

      const sent = request.send();
      await flushPromises();
      dispatcher.clearQueue(request.queryKey);
      const response = await sent;
      client.appManager.setOnline(true);
      await flushPromises();

      expect(response.error?.message).toBe("Request deleted");
      expect(calls).toHaveLength(0);
    });

    it("should resolve a request waiting for its retry", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest({ retry: 3, retryTime: 1000 });

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      dispatcher.clearQueue(request.queryKey);
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(response.error?.message).toBe("Request deleted");
      expect(calls).toHaveLength(1);
      expectNothingLeft(client);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should resolve a running request which fails after its queue was cleared instead of waiting for a retry", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest({ retry: 3, retryTime: 1000 });

      const sent = request.send();
      await flushPromises();
      dispatcher.clearQueue(request.queryKey);
      await calls[0].fail({ message: "Failed after clearing" });
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(response.error).toEqual({ message: "Failed after clearing" });
      expect(calls).toHaveLength(1);
      expectNothingLeft(client);
    });

    it("should resolve a running request which fails offline after its queue was cleared", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      const sent = request.send();
      await flushPromises();
      dispatcher.clearQueue(request.queryKey);
      client.appManager.setOnline(false);
      await calls[0].fail({ message: "Network error" }, 0);

      await expect(sent).resolves.toHaveProperty("error", { message: "Network error" });
    });

    it("should report each cleared request once", async () => {
      const { client, createRequest, dispatcher } = setup();
      const request = createRequest({ queued: true });
      const removed: string[] = [];
      client.requestManager.events.onRemove(({ requestId }) => removed.push(requestId));

      request.send();
      request.send();
      request.send();
      await flushPromises();
      const waitingIds = dispatcher
        .getQueue(request.queryKey)
        .requests.slice(1)
        .map((item) => item.requestId);
      dispatcher.clearQueue(request.queryKey);

      expect(removed).toEqual(waitingIds);
    });

    it("should keep the stopped state of the queue", async () => {
      const { createRequest, dispatcher } = setup();
      const request = createRequest();

      dispatcher.pause(request.queryKey);
      request.send();
      dispatcher.clearQueue(request.queryKey);

      expect(dispatcher.getQueue(request.queryKey)).toEqual({
        queryKey: request.queryKey,
        requests: [],
        stopped: true,
      });
    });
  });

  describe("When the whole dispatcher is cleared", () => {
    it("should abort the running requests", async () => {
      const { createRequest, calls, dispatcher } = setup();

      const sent = createRequest().send();
      await flushPromises();
      dispatcher.clear();
      const response = await sent;

      expect(calls[0].isAborted()).toBe(true);
      expect(response.error?.message).toBe("Request aborted");
    });

    it("should resolve the queued requests which did not start yet", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest({ queued: true });

      const sent = [request.send(), request.send(), request.send()];
      await flushPromises();
      dispatcher.clear();
      const responses = await Promise.all(sent);
      await vi.advanceTimersByTimeAsync(60_000);

      expect(responses.map((response) => response.error?.message)).toEqual([
        "Request aborted",
        "Request deleted",
        "Request deleted",
      ]);
      expect(calls).toHaveLength(1);
    });

    it("should resolve the requests waiting for the network", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      client.appManager.setOnline(false);

      const sent = [createRequest({ endpoint: "/a" }).send(), createRequest({ endpoint: "/b" }).send()];
      await flushPromises();
      dispatcher.clear();
      const responses = await Promise.all(sent);
      client.appManager.setOnline(true);
      await flushPromises();

      expect(responses.map((response) => response.error?.message)).toEqual(["Request deleted", "Request deleted"]);
      expect(calls).toHaveLength(0);
    });

    it("should resolve the requests waiting for their retry and never send them again", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest({ retry: 3, retryTime: 1000 });

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      dispatcher.clear();
      const response = await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(response.error?.message).toBe("Request deleted");
      expect(calls).toHaveLength(1);
      expectNothingLeft(client);
    });

    it("should leave nothing behind", async () => {
      const { client, createRequest, dispatcher } = setup();
      const queued = createRequest({ queued: true });

      const sent = [queued.send(), queued.send(), createRequest({ endpoint: "/other" }).send()];
      await flushPromises();
      dispatcher.clear();
      await Promise.all(sent);
      await flushPromises();

      expect(dispatcher.getQueuesKeys()).toEqual([]);
      expectNothingLeft(client);
    });

    it("should accept new requests afterwards", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      request.send();
      await flushPromises();
      dispatcher.clear();
      const sent = request.send();
      await flushPromises();
      await calls[1].succeed("after clear");

      await expect(sent).resolves.toHaveProperty("data", "after clear");
    });
  });

  describe("When a single request is deleted", () => {
    it("should abort it when it is running", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      const sent = request.send();
      await flushPromises();
      dispatcher.delete(request.queryKey, calls[0].requestId, request.abortKey);
      const response = await sent;

      expect(calls[0].isAborted()).toBe(true);
      expect(response.success).toBe(false);
    });

    it("should do nothing for an unknown request", () => {
      const { createRequest, dispatcher } = setup();
      const request = createRequest();
      const onChange = vi.fn();
      dispatcher.events.onQueueChange(onChange);

      expect(dispatcher.delete(request.queryKey, "unknown", request.abortKey)).toBeUndefined();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should keep the other requests of the queue", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest({ queued: true });

      request.send({ payload: 1 });
      const second = request.send({ payload: 2 });
      request.send({ payload: 3 });
      await flushPromises();
      const [, secondItem] = dispatcher.getQueue(request.queryKey).requests;
      dispatcher.delete(request.queryKey, secondItem.requestId, request.abortKey);
      await expect(second).resolves.toHaveProperty("error.message", "Request deleted");
      await calls[0].succeed();
      await flushPromises();

      expect(calls.map((call) => call.request.payload)).toEqual([1, 3]);
    });

    it("should tell that the queue got drained with its last request", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();
      const onDrained = vi.fn();
      dispatcher.events.onDrainedByKey(request.queryKey, onDrained);

      request.send();
      request.send();
      await flushPromises();
      await calls[0].succeed();
      expect(onDrained).not.toHaveBeenCalled();
      await calls[1].succeed();

      expect(onDrained).toHaveBeenCalledTimes(1);
    });
  });

  describe("When many requests go through one dispatcher", () => {
    // Plenty of time for a busy machine - these tests check the results, not the speed
    const volumeTimeout = 120_000;

    it(
      "should resolve thousands of concurrent requests with their own responses",
      async () => {
        const { client, createRequest, calls } = setup();
        const request = createRequest();
        const count = 2000;

        const sent = Array.from({ length: count }, (_, index) => request.send({ payload: index }));
        await flushPromises();
        expect(calls).toHaveLength(count);
        // Answer in the reverse order
        await Promise.all(calls.toReversed().map((call) => call.succeed({ echo: call.request.payload })));
        const responses = await Promise.all(sent);

        expect(responses.every((response, index) => (response.data as { echo: number }).echo === index)).toBe(true);
        expectNothingLeft(client);
      },
      volumeTimeout,
    );

    it(
      "should send thousands of queued requests one by one in their order",
      async () => {
        const { client, createRequest, calls } = setup();
        const request = createRequest({ queued: true });
        const count = 1000;
        let maxInFlight = 0;
        client.submitDispatcher.events.onRunningRequestsChange(({ runningRequests }) => {
          maxInFlight = Math.max(maxInFlight, runningRequests.length);
        });

        const sent = Array.from({ length: count }, (_, index) => request.send({ payload: index }));
        for (let index = 0; index < count; index += 1) {
          // eslint-disable-next-line no-await-in-loop
          await flushPromises();
          // eslint-disable-next-line no-await-in-loop
          await calls[index].succeed(index);
        }
        const responses = await Promise.all(sent);

        expect(calls.map((call) => call.request.payload)).toEqual(Array.from({ length: count }, (_, index) => index));
        expect(responses.map((response) => response.data)).toEqual(Array.from({ length: count }, (_, index) => index));
        expect(maxInFlight).toBe(1);
        expectNothingLeft(client);
      },
      volumeTimeout,
    );

    it(
      "should keep the results right for a mix of successes, errors and aborts",
      async () => {
        const { client, createRequest, calls } = setup();
        const request = createRequest();
        const count = 900;

        const sent = Array.from({ length: count }, (_, index) => request.send({ payload: index }));
        await flushPromises();
        await Promise.all(
          calls.map((call, index) => {
            if (index % 3 === 0) {
              return call.succeed(index);
            }
            if (index % 3 === 1) {
              return call.fail({ message: `error-${index}` });
            }
            client.requestManager.abortByRequestId(request.abortKey, call.requestId);
            return Promise.resolve();
          }),
        );
        const responses = await Promise.all(sent);

        responses.forEach((response, index) => {
          if (index % 3 === 0) {
            expect(response.data).toBe(index);
          }
          if (index % 3 === 1) {
            expect(response.error).toEqual({ message: `error-${index}` });
          }
          if (index % 3 === 2) {
            expect(response.error?.message).toBe("Request aborted");
          }
        });
        expectNothingLeft(client);
      },
      volumeTimeout,
    );
  });
});
