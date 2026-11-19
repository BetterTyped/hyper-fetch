import { createControlledClient, flushPromises, isPending } from "../../utils/controlled-adapter.utils";

/**
 * Mappers and callbacks are the code of the user running inside the request lifecycle. Whatever they do - return,
 * resolve later, throw or reject - `send()` and `exec()` have to settle and the queue behind them has to move on.
 */
describe("Request [ Lifecycle ]", () => {
  const setup = () => {
    const { client, calls } = createControlledClient();
    const request = client.createRequest<{ response: any; payload: any; error: any }>()({
      endpoint: "/lifecycle",
      method: "POST",
    });

    return { client, calls, request, dispatcher: client.submitDispatcher };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe.each(["send", "exec"] as const)("When the response mapper is used with %s", (method) => {
    it("should give the mapped response", async () => {
      const { request, calls } = setup();
      const mapped = request.setResponseMapper((response): any => ({
        ...response,
        data: { name: response.data.NAME },
      }));

      const sent = mapped[method]({});
      await flushPromises();
      await calls[0].succeed({ NAME: "John" });

      await expect(sent).resolves.toHaveProperty("data", { name: "John" });
    });

    it("should wait for an async mapper", async () => {
      const { request, calls } = setup();
      const mapped = request.setResponseMapper(async (response): Promise<any> => ({ ...response, data: "async" }));

      const sent = mapped[method]({});
      await flushPromises();
      await calls[0].succeed("raw");

      await expect(sent).resolves.toHaveProperty("data", "async");
    });

    it("should map the error responses too", async () => {
      const { request, calls } = setup();
      const mapped = request.setResponseMapper((response): any => ({ ...response, error: { code: response.status } }));

      const sent = mapped[method]({});
      await flushPromises();
      await calls[0].fail({ message: "Failed" }, 422);

      await expect(sent).resolves.toHaveProperty("error", { code: 422 });
    });

    it("should let the mapper turn a success into an error", async () => {
      const { request, calls } = setup();
      const mapped = request.setResponseMapper((response): any => ({
        ...response,
        data: null,
        error: { message: "Invalid" },
        success: false as const,
      }));

      const sent = mapped[method]({});
      await flushPromises();
      await calls[0].succeed({ invalid: true });
      const response = await sent;

      expect(response.success).toBe(false);
      expect(response.error).toEqual({ message: "Invalid" });
    });

    it("should give the thrown error instead of hanging", async () => {
      const { request, calls } = setup();
      const error = new Error("Invalid response");
      const mapped = request.setResponseMapper((): any => {
        throw error;
      });

      const sent = mapped[method]({});
      await flushPromises();
      await calls[0].succeed({ invalid: true });
      const response = await sent;

      expect(response.error).toBe(error);
      expect(response.data).toBeNull();
      expect(response.success).toBe(false);
      expect(response.status).toBe(200);
    });

    it("should give the rejection of an async mapper instead of hanging", async () => {
      const { request, calls } = setup();
      const error = new Error("Invalid response");
      const mapped = request.setResponseMapper(async (): Promise<any> => {
        throw error;
      });

      const sent = mapped[method]({});
      await flushPromises();
      await calls[0].succeed({ invalid: true });
      const response = await sent;

      expect(response.error).toBe(error);
      expect(response.success).toBe(false);
    });

    it("should use the response as it is when the mapper returns nothing", async () => {
      const { request, calls } = setup();
      const mapped = request.setResponseMapper((() => {}) as never);

      const sent = mapped[method]({});
      await flushPromises();
      await calls[0].succeed("raw");

      await expect(sent).resolves.toHaveProperty("data", "raw");
    });
  });

  describe("When the response mapper throws for a request sent with the dispatcher", () => {
    it("should remove the request from the queue", async () => {
      const { client, request, calls, dispatcher } = setup();
      const mapped = request.setResponseMapper((): any => {
        throw new Error("Invalid response");
      });

      const sent = mapped.send();
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      expect(dispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(client.requestManager.abortControllers.size).toBe(0);
    });

    it("should not block the queued requests behind it", async () => {
      const { request, calls } = setup();
      const queued = request.setQueued(true);
      const broken = queued.setResponseMapper((): any => {
        throw new Error("Invalid response");
      });

      const first = broken.send();
      const second = queued.send();
      await flushPromises();
      await calls[0].succeed("first");
      await flushPromises();
      await calls[1].succeed("second");

      await expect(first).resolves.toHaveProperty("success", false);
      await expect(second).resolves.toHaveProperty("data", "second");
    });

    it("should call the onResponse callback once", async () => {
      const { request, calls } = setup();
      const onResponse = vi.fn();
      const mapped = request.setResponseMapper(async (): Promise<any> => {
        throw new Error("Invalid response");
      });

      const sent = mapped.send({ onResponse });
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expect(onResponse).toHaveBeenCalledTimes(1);
    });

    it("should give the thrown error for a response read from the cache", async () => {
      const { request, calls } = setup();
      let shouldThrow = false;
      const mapped = request.setResponseMapper((response): any => {
        if (shouldThrow) {
          throw new Error("Invalid cache");
        }
        return response;
      });

      const sent = mapped.send();
      await flushPromises();
      await calls[0].succeed("cached");
      await sent;
      shouldThrow = true;
      const response = await mapped.send({ cachePolicy: "cache-first" });

      expect(response.success).toBe(false);
      expect(response.error.message).toBe("Invalid cache");
      expect(calls).toHaveLength(1);
    });
  });

  describe.each(["send", "exec"] as const)("When the request mapper is used with %s", (method) => {
    it("should send the mapped request", async () => {
      const { request, calls } = setup();
      const mapped = request.setRequestMapper((current) => current.setHeaders({ "X-Mapped": "1" }));

      const sent = mapped[method]({});
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expect(calls[0].request.headers).toEqual({ "X-Mapped": "1" });
    });

    it("should wait for an async mapper", async () => {
      const { request, calls } = setup();
      const mapped = request.setRequestMapper(async (current) => current.setPayload({ mapped: true }));

      const sent = mapped[method]({});
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expect(calls[0].request.payload).toEqual({ mapped: true });
    });

    it("should receive the request with the values given to the call", async () => {
      const { request, calls } = setup();
      const payloads: unknown[] = [];
      const mapped = request.setRequestMapper((current) => {
        payloads.push(current.payload);
        return current;
      });

      const sent = mapped[method]({ payload: { name: "John" } });
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expect(payloads).toEqual([{ name: "John" }]);
    });

    it.each([
      [
        "throws",
        () => () => {
          throw new Error("Invalid request");
        },
      ],
      [
        "rejects",
        () => async () => {
          throw new Error("Invalid request");
        },
      ],
    ])("should give the error without sending anything when the mapper %s", async (_, createMapper) => {
      const { request, calls } = setup();
      const mapped = request.setRequestMapper(createMapper() as never);

      const response = await mapped[method]({});

      expect(response.error.message).toBe("Invalid request");
      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
      expect(calls).toHaveLength(0);
    });
  });

  describe("When the payload mapper is used", () => {
    it("should send the mapped payload and keep the original one on the request", async () => {
      const { client, request } = setup();
      const payloads: unknown[] = [];
      client.adapter.setFetcher(async ({ payload, onSuccess }) => {
        payloads.push(payload);
        await onSuccess({ data: null, status: 200, extra: { headers: {} } });
      });
      const mapped = request.setPayloadMapper((payload: { name: string }) => ({ name: payload.name.toUpperCase() }));

      await mapped.send({ payload: { name: "john" } });

      expect(payloads).toEqual([{ name: "JOHN" }]);
    });

    it.each([
      [
        "throws",
        () => {
          throw new Error("Invalid payload");
        },
      ],
      [
        "rejects",
        async () => {
          throw new Error("Invalid payload");
        },
      ],
    ])("should give the error when the mapper %s", async (_, mapper) => {
      const { request, calls } = setup();

      const response = await request.setPayloadMapper(mapper).send({ payload: {} });

      expect(response.error.message).toBe("Invalid payload");
      expect(response.success).toBe(false);
      expect(calls).toHaveLength(0);
    });
  });

  describe("When send is compared with exec", () => {
    it("should put only the request made with send into the dispatcher queue", async () => {
      const { request, dispatcher } = setup();
      const onQueueChange = vi.fn();
      dispatcher.events.onQueueChange(onQueueChange);

      request.exec({});
      await flushPromises();
      expect(onQueueChange).not.toHaveBeenCalled();
      request.send();
      await flushPromises();

      expect(onQueueChange).toHaveBeenCalled();
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(1);
    });

    it("should save only the response of send in the cache", async () => {
      const { request, calls } = setup();

      const executed = request.exec({});
      await flushPromises();
      await calls[0].succeed("exec");
      await executed;
      expect(request.read()).toBeUndefined();

      const sent = request.send();
      await flushPromises();
      await calls[1].succeed("send");
      await sent;

      expect(request.read()?.data).toBe("send");
    });

    it("should not retry the request made with exec", async () => {
      const { request, calls } = setup();

      const executed = request.setRetry(3).setRetryTime(10).exec({});
      await flushPromises();
      await calls[0].fail();
      const response = await executed;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(response.success).toBe(false);
      expect(calls).toHaveLength(1);
    });

    it("should not deduplicate the requests made with exec", async () => {
      const { request, calls } = setup();
      const deduplicated = request.setDeduplicate(true);

      deduplicated.exec({});
      deduplicated.exec({});
      await flushPromises();

      expect(calls).toHaveLength(2);
    });

    it("should send the request made with exec even when the queue is stopped", async () => {
      const { request, calls, dispatcher } = setup();
      dispatcher.stop(request.queryKey);

      request.exec({});
      request.send();
      await flushPromises();

      expect(calls).toHaveLength(1);
    });

    it("should abort the request made with exec", async () => {
      const { request, calls } = setup();

      const executed = request.exec({});
      await flushPromises();
      request.abort();
      const response = await executed;

      expect(calls[0].isAborted()).toBe(true);
      expect(response.error.message).toBe("Request aborted");
    });

    it("should use the values given to exec", async () => {
      const { client, calls } = setup();
      const request = client.createRequest<{ payload: any; queryParams: any }>()({
        endpoint: "/users/:userId",
        method: "POST",
      });

      request.exec({ params: { userId: 3 }, payload: { a: 1 }, queryParams: { page: 2 } });
      await flushPromises();

      expect(calls[0].request.endpoint).toBe("/users/3");
      expect(calls[0].request.payload).toEqual({ a: 1 });
      expect(calls[0].request.queryParams).toEqual({ page: 2 });
    });
  });

  describe("When callbacks are passed to send", () => {
    it("should call them in the order of the request lifecycle", async () => {
      const { request, calls } = setup();
      const order: string[] = [];

      const sent = request.send({
        onBeforeSent: () => order.push("onBeforeSent"),
        onRequestStart: () => order.push("onRequestStart"),
        onUploadProgress: () => order.push("onUploadProgress"),
        onResponseStart: () => order.push("onResponseStart"),
        onDownloadProgress: () => order.push("onDownloadProgress"),
        onResponse: () => order.push("onResponse"),
        onRemove: () => order.push("onRemove"),
      });
      order.push("send returned");
      await flushPromises();
      await calls[0].succeed();
      await sent;
      order.push("promise resolved");

      expect(order).toEqual([
        "onBeforeSent",
        "send returned",
        "onUploadProgress",
        "onRequestStart",
        "onUploadProgress",
        "onDownloadProgress",
        "onResponseStart",
        "onDownloadProgress",
        "onResponse",
        "promise resolved",
      ]);
    });

    it("should give the same requestId to every callback", async () => {
      const { request, calls } = setup();
      const ids: string[] = [];
      const collect = ({ requestId }: { requestId: string }) => ids.push(requestId);

      const sent = request.send({
        onBeforeSent: collect,
        onRequestStart: collect,
        onResponseStart: collect,
        onResponse: collect,
      });
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expect(ids).toHaveLength(4);
      expect(new Set(ids)).toEqual(new Set([calls[0].requestId]));
    });

    it("should call the hooks of the request after the callbacks of the call", async () => {
      const { request, calls } = setup();
      const order: string[] = [];
      request.$hooks.onBeforeSent(() => order.push("hook onBeforeSent"));
      request.$hooks.onResponse(() => order.push("hook onResponse"));

      const sent = request.send({
        onBeforeSent: () => order.push("onBeforeSent"),
        onResponse: () => order.push("onResponse"),
      });
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expect(order).toEqual(["onBeforeSent", "hook onBeforeSent", "onResponse", "hook onResponse"]);
    });

    it("should call onResponse once for a retried request - with the final response", async () => {
      const { request, calls } = setup();
      const onResponse = vi.fn();
      const onRequestStart = vi.fn();

      const sent = request.setRetry(1).setRetryTime(100).send({ onResponse, onRequestStart });
      await flushPromises();
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(100);
      await calls[1].succeed("retried");
      await sent;

      expect(onRequestStart).toHaveBeenCalledTimes(2);
      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(onResponse.mock.calls[0][0].response.data).toBe("retried");
    });

    it("should call onRemove instead of onResponse for a removed request", async () => {
      const { client, request, dispatcher } = setup();
      const onResponse = vi.fn();
      const onRemove = vi.fn();
      client.appManager.setOnline(false);

      const sent = request.send({ onResponse, onRemove });
      await flushPromises();
      dispatcher.clearQueue(request.queryKey);
      await sent;

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onResponse).not.toHaveBeenCalled();
    });

    it("should not call the callbacks of a finished request again", async () => {
      const { request, calls } = setup();
      const onResponse = vi.fn();

      const first = request.send({ onResponse });
      await flushPromises();
      await calls[0].succeed();
      await first;
      const second = request.send();
      await flushPromises();
      await calls[1].succeed();
      await second;

      expect(onResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe("When a callback throws", () => {
    const callbackError = new Error("Broken callback");
    const throwing = () => {
      throw callbackError;
    };
    // The error of a callback is not swallowed - it is thrown from a timer, outside of the request lifecycle
    const reported: unknown[] = [];
    const flush = async () => {
      try {
        await vi.advanceTimersByTimeAsync(0);
      } catch (error) {
        reported.push(error);
      }
    };
    const getReported = () => {
      try {
        vi.runAllTimers();
      } catch (error) {
        reported.push(error);
      }
      return reported;
    };

    beforeEach(() => {
      reported.length = 0;
    });

    it.each(["onBeforeSent", "onRequestStart", "onResponseStart", "onUploadProgress", "onDownloadProgress"] as const)(
      "should still give the response when %s throws",
      async (name) => {
        const { request, calls } = setup();

        const sent = request.send({ [name]: throwing });
        await flush();
        await calls[0].succeed("done");
        const response = await sent;

        expect(response.data).toBe("done");
        expect(getReported()).toContain(callbackError);
      },
    );

    it("should still resolve when onResponse throws", async () => {
      const { client, request, calls, dispatcher } = setup();

      const sent = request.send({ onResponse: throwing });
      await flush();
      await calls[0].succeed("done");
      const response = await sent;

      expect(response.data).toBe("done");
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      expect(client.requestManager.abortControllers.size).toBe(0);
      expect(getReported()).toContain(callbackError);
    });

    it("should still resolve when onRemove throws", async () => {
      const { client, request, dispatcher } = setup();
      client.appManager.setOnline(false);

      const sent = request.send({ onRemove: throwing });
      await flush();
      dispatcher.clearQueue(request.queryKey);
      const response = await sent;

      expect(response.error.message).toBe("Request deleted");
      expect(getReported()).toContain(callbackError);
    });

    it("should still resolve when a hook of the request throws", async () => {
      const { request, calls } = setup();
      const onResponse = vi.fn();
      request.$hooks.onResponse(throwing);

      const sent = request.send({ onResponse });
      await flush();
      await calls[0].succeed("done");
      const response = await sent;

      expect(response.data).toBe("done");
      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(getReported()).toContain(callbackError);
    });

    it("should not block the queued requests behind it", async () => {
      const { request, calls } = setup();
      const queued = request.setQueued(true);

      const first = queued.send({ onResponse: throwing });
      const second = queued.send();
      await flush();
      await calls[0].succeed("first");
      await flush();
      expect(calls).toHaveLength(2);
      await calls[1].succeed("second");

      await expect(first).resolves.toHaveProperty("data", "first");
      await expect(second).resolves.toHaveProperty("data", "second");
      expect(getReported()).toContain(callbackError);
    });

    it("should not leave the request in the queue when a listener of the response event throws", async () => {
      const { client, request, calls, dispatcher } = setup();
      const onLoading = vi.fn();
      client.requestManager.events.onResponse(throwing);
      client.requestManager.events.onLoading(onLoading);

      request.send();
      await flush();
      await calls[0].succeed("done");
      await flush();

      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      expect(onLoading).toHaveBeenLastCalledWith(expect.objectContaining({ loading: false }));
      expect(request.read()?.data).toBe("done");
      expect(getReported()).toContain(callbackError);
    });
  });

  describe("When the optimistic callback is set", () => {
    it("should pass its context to the callbacks", async () => {
      const { request, calls } = setup();
      const contexts: unknown[] = [];
      const optimistic = request.setOptimistic(() => ({ context: { snapshot: 1 } }));

      const sent = optimistic.send({
        onBeforeSent: ({ mutationContext }) => contexts.push(mutationContext?.context),
        onResponse: ({ mutationContext }) => contexts.push(mutationContext?.context),
      });
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expect(contexts).toEqual([{ snapshot: 1 }, { snapshot: 1 }]);
    });

    it("should give the error without sending when the callback throws", async () => {
      const { request, calls, dispatcher } = setup();
      const optimistic = request.setOptimistic(() => {
        throw new Error("No snapshot");
      });

      const response = await optimistic.send();

      expect(response.success).toBe(false);
      expect(response.error.message).toBe("Optimistic callback failed: No snapshot");
      expect(calls).toHaveLength(0);
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });
  });

  describe("When nothing answers", () => {
    it("should keep the promise pending without resolving on its own", async () => {
      const { request } = setup();

      const sent = request.send();
      await vi.advanceTimersByTimeAsync(600_000);

      expect(await isPending(sent)).toBe(true);
    });
  });
});
