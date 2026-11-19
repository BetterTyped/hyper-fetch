import { RequestManager } from "managers";
import { scopeKey } from "request";

import { createControlledClient, flushPromises, isPending } from "../../../utils/controlled-adapter.utils";

describe("RequestManager [ Abort ]", () => {
  const setup = () => {
    const { client, calls } = createControlledClient();
    const createRequest = (endpoint = "/abort", options: { queued?: boolean; abortKey?: string } = {}) =>
      client.createRequest<{ response: any; error: any }>()({ endpoint, method: "POST", ...options });

    return { client, calls, createRequest, manager: client.requestManager };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("When keeping the abort controllers", () => {
    it("should create a controller for a request", () => {
      const manager = new RequestManager();

      manager.addAbortController("key", "1");

      expect(manager.getAbortController("key", "1")).toBeInstanceOf(AbortController);
      expect(manager.getAbortController("key", "2")).toBeUndefined();
      expect(manager.getAbortController("other", "1")).toBeUndefined();
    });

    it("should keep the controller which is still in use", () => {
      const manager = new RequestManager();

      manager.addAbortController("key", "1");
      const controller = manager.getAbortController("key", "1");
      manager.addAbortController("key", "1");

      expect(manager.getAbortController("key", "1")).toBe(controller);
    });

    it("should replace an aborted controller", () => {
      const manager = new RequestManager();

      manager.addAbortController("key", "1");
      const controller = manager.getAbortController("key", "1");
      manager.abortByRequestId("key", "1");
      manager.addAbortController("key", "1");

      expect(controller?.signal.aborted).toBe(true);
      expect(manager.getAbortController("key", "1")).not.toBe(controller);
      expect(manager.getAbortController("key", "1")?.signal.aborted).toBe(false);
    });

    it("should remove only the given controller", () => {
      const manager = new RequestManager();

      manager.addAbortController("key", "1");
      manager.addAbortController("key", "2");
      manager.removeAbortController("key", "1");

      expect(manager.getAbortController("key", "1")).toBeUndefined();
      expect(manager.getAbortController("key", "2")).toBeDefined();
    });

    it("should not keep an empty group after its last controller is removed", () => {
      const manager = new RequestManager();

      manager.addAbortController("key", "1");
      manager.addAbortController("key", "2");
      manager.removeAbortController("key", "1");
      expect(manager.abortControllers.size).toBe(1);
      manager.removeAbortController("key", "2");

      expect(manager.abortControllers.size).toBe(0);
    });

    it("should not grow with every scope which was used", async () => {
      const { createRequest, calls, manager } = setup();
      const request = createRequest();

      const sent = ["session-1", "session-2", "session-3"].map((scope) => request.setScope(scope).send());
      await flushPromises();
      expect(manager.abortControllers.size).toBe(3);
      await Promise.all(calls.map((call) => call.succeed()));
      await Promise.all(sent);

      expect(manager.abortControllers.size).toBe(0);
    });

    it.each(["abortByKey", "abortByRequestId", "removeAbortController"] as const)(
      "should do nothing when %s gets unknown values",
      (method) => {
        const manager = new RequestManager();

        expect(() => manager[method]("unknown", "unknown")).not.toThrow();
        expect(manager.abortControllers.size).toBe(0);
      },
    );
  });

  describe("When aborting by the abort key", () => {
    it("should abort all the running requests with this key", async () => {
      const { createRequest, calls, manager } = setup();
      const request = createRequest();

      const sent = [request.send(), request.send(), request.send()];
      await flushPromises();
      manager.abortByKey(request.abortKey);
      const responses = await Promise.all(sent);

      expect(calls.map((call) => call.isAborted())).toEqual([true, true, true]);
      expect(responses.map((response) => response.error.message)).toEqual([
        "Request aborted",
        "Request aborted",
        "Request aborted",
      ]);
    });

    it("should not abort the requests with other keys", async () => {
      const { createRequest, calls, manager } = setup();
      const users = createRequest("/users");
      const posts = createRequest("/posts");

      users.send();
      const postsSent = posts.send();
      await flushPromises();
      manager.abortByKey(users.abortKey);
      await flushPromises();

      expect(calls.map((call) => call.isAborted())).toEqual([true, false]);
      expect(await isPending(postsSent)).toBe(true);
    });

    it("should abort the requests of different endpoints sharing a custom key", async () => {
      const { createRequest, calls, manager } = setup();

      createRequest("/users", { abortKey: "page" }).send();
      createRequest("/posts", { abortKey: "page" }).send();
      createRequest("/other").send();
      await flushPromises();
      manager.abortByKey("page");

      expect(calls.map((call) => call.isAborted())).toEqual([true, true, false]);
    });

    it("should abort all the params of one endpoint with the abort method of the request", async () => {
      const { client, calls } = setup();
      const request = client.createRequest()({ endpoint: "/users/:userId", method: "POST" });

      request.send({ params: { userId: 1 } });
      request.send({ params: { userId: 2 } });
      await flushPromises();
      request.abort();

      expect(calls.map((call) => call.isAborted())).toEqual([true, true]);
    });

    it("should abort only the requests of the same scope", async () => {
      const { createRequest, calls } = setup();
      const first = createRequest().setScope("session-1");
      const second = createRequest().setScope("session-2");

      first.send();
      second.send();
      await flushPromises();
      first.abort();

      expect(calls.map((call) => call.isAborted())).toEqual([true, false]);
    });

    it("should not abort a queued request which did not start yet", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest("/abort", { queued: true });

      const first = request.send();
      const second = request.send();
      await flushPromises();
      request.abort();
      await expect(first).resolves.toHaveProperty("error.message", "Request aborted");
      await flushPromises();
      await calls[1].succeed("second");

      await expect(second).resolves.toHaveProperty("data", "second");
    });
  });

  describe("When aborting by the request id", () => {
    it("should abort only this request", async () => {
      const { createRequest, calls, manager } = setup();
      const request = createRequest();

      const sent = [request.send(), request.send()];
      await flushPromises();
      manager.abortByRequestId(request.abortKey, calls[1].requestId);
      await calls[0].succeed("first");
      const responses = await Promise.all(sent);

      expect(responses[0].data).toBe("first");
      expect(responses[1].error.message).toBe("Request aborted");
    });

    it("should need the scoped key for a request with a scope", async () => {
      const { createRequest, calls, manager } = setup();
      const request = createRequest().setScope("session");

      request.send();
      await flushPromises();
      manager.abortByRequestId(request.abortKey, calls[0].requestId);
      expect(calls[0].isAborted()).toBe(false);
      manager.abortByRequestId(scopeKey(request.abortKey, request.scope), calls[0].requestId);

      expect(calls[0].isAborted()).toBe(true);
    });
  });

  describe("When aborting everything", () => {
    it("should abort the requests of all keys and both dispatchers", async () => {
      const { client, createRequest, calls, manager } = setup();
      const query = client.createRequest()({ endpoint: "/query" });

      const sent = [createRequest("/a").send(), createRequest("/b").send(), query.send()];
      await flushPromises();
      manager.abortAll();
      const responses = await Promise.all(sent);

      expect(calls.map((call) => call.isAborted())).toEqual([true, true, true]);
      expect(responses.every((response) => !response.success)).toBe(true);
      expect(manager.abortControllers.size).toBe(0);
    });

    it("should let new requests through afterwards", async () => {
      const { createRequest, calls, manager } = setup();
      const request = createRequest();

      request.send();
      await flushPromises();
      manager.abortAll();
      const sent = request.send();
      await flushPromises();
      await calls[1].succeed("after");

      await expect(sent).resolves.toHaveProperty("data", "after");
    });
  });

  describe("When aborting at different moments", () => {
    it("should abort a request before it reaches the adapter", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest();

      const sent = request.send();
      request.abort();
      const response = await sent;

      expect(response.error.message).toBe("Request aborted");
      expect(response.status).toBe(0);
      expect(calls).toHaveLength(0);
    });

    it("should give one response and one abort event for a request aborted twice", async () => {
      const { createRequest, manager } = setup();
      const request = createRequest();
      const onAbort = vi.fn();
      const onResponse = vi.fn();
      manager.events.onAbort(onAbort);
      manager.events.onResponse(onResponse);

      const sent = request.send();
      await flushPromises();
      request.abort();
      request.abort();
      manager.abortAll();
      await sent;
      await flushPromises();

      expect(onAbort).toHaveBeenCalledTimes(1);
      expect(onResponse).toHaveBeenCalledTimes(1);
    });

    it("should do nothing for a finished request", async () => {
      const { createRequest, calls, manager } = setup();
      const request = createRequest();
      const onAbort = vi.fn();
      manager.events.onAbort(onAbort);

      const sent = request.send();
      await flushPromises();
      await calls[0].succeed("done");
      const response = await sent;
      request.abort();
      manager.abortByRequestId(request.abortKey, calls[0].requestId);
      await flushPromises();

      expect(response.data).toBe("done");
      expect(onAbort).not.toHaveBeenCalled();
    });

    it("should mark the response of an aborted request as canceled", async () => {
      const { createRequest, manager } = setup();
      const request = createRequest();
      const canceled: boolean[] = [];
      manager.events.onResponse(({ details }) => canceled.push(details.isCanceled));

      const sent = request.send();
      await flushPromises();
      request.abort();
      await sent;

      expect(canceled).toEqual([true]);
    });

    it("should send the request again after it was aborted", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest();

      const first = request.send();
      await flushPromises();
      request.abort();
      await first;
      const second = request.send();
      await flushPromises();
      await calls[1].succeed("again");

      await expect(second).resolves.toHaveProperty("data", "again");
    });
  });

  describe("When listening to the request events", () => {
    const listen = (
      setupResult: ReturnType<typeof setup>,
      request: ReturnType<ReturnType<typeof setup>["createRequest"]>,
    ) => {
      const { events } = setupResult.manager;
      const log: string[] = [];
      events.onLoading(({ loading }) => log.push(`loading:${loading}`));
      events.onRequestStart(() => log.push("requestStart"));
      events.onResponseStart(() => log.push("responseStart"));
      events.onResponse(() => log.push("response"));
      events.onAbort(() => log.push("abort"));
      events.onRemove(() => log.push("remove"));

      const byQueue: string[] = [];
      events.onLoadingByQueue(request.queryKey, ({ loading }) => byQueue.push(`loading:${loading}`));
      events.onRequestStartByQueue(request.queryKey, () => byQueue.push("requestStart"));
      events.onResponseStartByQueue(request.queryKey, () => byQueue.push("responseStart"));
      events.onResponseByCache(request.cacheKey, () => byQueue.push("response"));
      events.onAbortByKey(request.abortKey, () => byQueue.push("abort"));
      events.onRemoveByQueue(request.queryKey, () => byQueue.push("remove"));

      const byId: string[] = [];
      const listenById = (requestId: string) => {
        events.onLoadingById(requestId, ({ loading }) => byId.push(`loading:${loading}`));
        events.onRequestStartById(requestId, () => byId.push("requestStart"));
        events.onResponseStartById(requestId, () => byId.push("responseStart"));
        events.onResponseById(requestId, () => byId.push("response"));
        events.onAbortById(requestId, () => byId.push("abort"));
        events.onRemoveById(requestId, () => byId.push("remove"));
      };

      return { log, byQueue, byId, listenById };
    };

    it("should emit every event of a successful request once and in order", async () => {
      const context = setup();
      const request = context.createRequest();
      const { log, byQueue } = listen(context, request);

      const sent = request.send();
      await flushPromises();
      await context.calls[0].succeed();
      await sent;
      await flushPromises();

      const expected = ["loading:true", "requestStart", "responseStart", "response", "loading:false", "remove"];
      expect(log).toEqual(expected);
      expect(byQueue).toEqual(expected);
    });

    it("should emit the same events for the listeners of one request", async () => {
      const context = setup();
      const request = context.createRequest();
      const { byId, listenById } = listen(context, request);

      const sent = request.send({ onBeforeSent: ({ requestId }) => listenById(requestId) });
      await flushPromises();
      await context.calls[0].fail();
      await sent;
      await flushPromises();

      // The listeners are added after the request was taken from the queue, so they miss only the first loading event
      expect(byId).toEqual(["requestStart", "responseStart", "response", "loading:false", "remove"]);
    });

    it("should emit the abort before the response of an aborted request", async () => {
      const context = setup();
      const request = context.createRequest();
      const { log, byQueue } = listen(context, request);

      const sent = request.send();
      await flushPromises();
      request.abort();
      await sent;
      await flushPromises();

      const expected = ["loading:true", "requestStart", "abort", "response", "loading:false", "remove"];
      expect(log).toEqual(expected);
      expect(byQueue).toEqual(expected);
    });

    it("should not emit the events of other requests to the listeners of one request", async () => {
      const context = setup();
      const request = context.createRequest();
      const other = context.createRequest("/other");
      const { byQueue, byId, listenById } = listen(context, request);

      request.send({ onBeforeSent: ({ requestId }) => listenById(requestId) });
      const sent = other.send();
      await flushPromises();
      await context.calls[1].succeed();
      await sent;
      await flushPromises();

      expect(byQueue).toEqual(["loading:true", "requestStart"]);
      expect(byId).toEqual(["requestStart"]);
    });

    it("should stop calling a listener after it is removed", async () => {
      const { createRequest, calls, manager } = setup();
      const request = createRequest();
      const onResponse = vi.fn();
      const unmount = manager.events.onResponse(onResponse);

      const first = request.send();
      await flushPromises();
      await calls[0].succeed();
      await first;
      unmount();
      const second = request.send();
      await flushPromises();
      await calls[1].succeed();
      await second;

      expect(onResponse).toHaveBeenCalledTimes(1);
    });
  });
});
