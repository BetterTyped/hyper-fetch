import { DispatcherMode, getRequestType } from "dispatcher";

import { createControlledClient, flushPromises, isPending } from "../../utils/controlled-adapter.utils";

describe("Dispatcher [ Modes ]", () => {
  const setup = () => {
    const { client, calls, getPending } = createControlledClient();
    const createRequest = (options: {
      queued?: boolean;
      cancelable?: boolean;
      deduplicate?: boolean;
      deduplicateTime?: number;
      method?: "GET" | "POST";
      endpoint?: string;
    }) =>
      client.createRequest<{ response: unknown; payload: any; queryParams?: { page?: number } }>()({
        endpoint: "/modes",
        method: "POST",
        ...options,
      });

    return { client, calls, getPending, createRequest, dispatcher: client.submitDispatcher };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("When picking the mode", () => {
    const { createRequest, dispatcher } = setup();
    const ongoing = dispatcher.createStorageItem(createRequest({}));

    it.each([
      { options: {}, mode: DispatcherMode.ALL_AT_ONCE },
      { options: { queued: true }, mode: DispatcherMode.ONE_BY_ONE },
      { options: { cancelable: true }, mode: DispatcherMode.PREVIOUS_CANCELED },
      { options: { deduplicate: true }, mode: DispatcherMode.DEDUPLICATED },
      // Pairs - the queue wins over canceling, canceling wins over deduplication
      { options: { queued: true, cancelable: true }, mode: DispatcherMode.ONE_BY_ONE },
      { options: { queued: true, deduplicate: true }, mode: DispatcherMode.ONE_BY_ONE },
      { options: { cancelable: true, deduplicate: true }, mode: DispatcherMode.PREVIOUS_CANCELED },
      { options: { queued: true, cancelable: true, deduplicate: true }, mode: DispatcherMode.ONE_BY_ONE },
    ])("should use the $mode mode for $options", ({ options, mode }) => {
      expect(getRequestType(createRequest(options), ongoing)).toBe(mode);
    });

    it("should not deduplicate when there is no request to join", () => {
      // oxlint-disable-next-line unicorn/no-useless-undefined
      expect(getRequestType(createRequest({ deduplicate: true }), undefined)).toBe(DispatcherMode.ALL_AT_ONCE);
    });

    it("should not join a request which already received its response", () => {
      const resolved = { ...ongoing, resolved: true };

      expect(getRequestType(createRequest({ deduplicate: true }), resolved)).toBe(DispatcherMode.ALL_AT_ONCE);
    });

    it("should not join a stopped request", () => {
      const stopped = { ...ongoing, stopped: true };

      expect(getRequestType(createRequest({ deduplicate: true }), stopped)).toBe(DispatcherMode.ALL_AT_ONCE);
    });

    it("should not deduplicate a request marked as used", () => {
      const used = createRequest({ deduplicate: true }).setUsed(true);

      expect(getRequestType(used, ongoing)).toBe(DispatcherMode.ALL_AT_ONCE);
    });
  });

  describe("When requests are concurrent", () => {
    it("should send all of them at once", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({});

      request.send();
      request.send();
      request.send();
      await flushPromises();

      expect(calls).toHaveLength(3);
      expect(new Set(calls.map((call) => call.requestId)).size).toBe(3);
    });

    it("should resolve each of them with its own response in any order", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({});

      const first = request.send();
      const second = request.send();
      const third = request.send();
      await flushPromises();
      await calls[2].succeed("third");
      await calls[0].fail({ message: "first" });
      await calls[1].succeed("second");
      const responses = await Promise.all([first, second, third]);

      expect(responses.map((response) => response.data ?? response.error)).toEqual([
        { message: "first" },
        "second",
        "third",
      ]);
    });

    it("should not make the others wait for a slow request", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({});

      const slow = request.send();
      const fast = request.send();
      await flushPromises();
      await calls[1].succeed("fast");

      await expect(fast).resolves.toHaveProperty("data", "fast");
      expect(await isPending(slow)).toBe(true);
    });

    it("should keep requests with different params in separate queues", async () => {
      const { client, calls, dispatcher } = setup();
      const request = client.createRequest()({ endpoint: "/users/:userId", method: "POST" });

      request.send({ params: { userId: 1 } });
      request.send({ params: { userId: 2 } });
      await flushPromises();

      expect(calls).toHaveLength(2);
      expect(dispatcher.getQueuesKeys()).toEqual(["POST_/users/1_", "POST_/users/2_"]);
    });
  });

  describe("When requests are queued", () => {
    it("should send only one request at a time", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ queued: true });

      request.send();
      request.send();
      request.send();
      await flushPromises();

      expect(calls).toHaveLength(1);
    });

    it("should send them in the order they were added", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ queued: true });

      const sent = [1, 2, 3, 4].map((payload) => request.send({ payload }));
      for (let index = 0; index < 4; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await flushPromises();
        expect(calls).toHaveLength(index + 1);
        // eslint-disable-next-line no-await-in-loop
        await calls[index].succeed(`response-${index + 1}`);
      }
      const responses = await Promise.all(sent);

      expect(calls.map((call) => call.request.payload)).toEqual([1, 2, 3, 4]);
      expect(responses.map((response) => response.data)).toEqual([
        "response-1",
        "response-2",
        "response-3",
        "response-4",
      ]);
    });

    it("should go on with the queue after a failed request", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ queued: true });

      const first = request.send({ payload: 1 });
      const second = request.send({ payload: 2 });
      await flushPromises();
      await calls[0].fail();
      await flushPromises();
      await calls[1].succeed();

      await expect(first).resolves.toHaveProperty("success", false);
      await expect(second).resolves.toHaveProperty("success", true);
    });

    it("should go on with the queue after an aborted request", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest({ queued: true });

      const first = request.send({ payload: 1 });
      const second = request.send({ payload: 2 });
      await flushPromises();
      client.requestManager.abortByRequestId(request.abortKey, calls[0].requestId);
      await flushPromises();
      expect(calls).toHaveLength(2);
      await calls[1].succeed();

      await expect(first).resolves.toHaveProperty("error.message", "Request aborted");
      await expect(second).resolves.toHaveProperty("success", true);
    });

    it("should run separate queues side by side", async () => {
      const { createRequest, calls } = setup();
      const uploads = createRequest({ queued: true, endpoint: "/uploads" });
      const comments = createRequest({ queued: true, endpoint: "/comments" });

      uploads.send();
      uploads.send();
      comments.send();
      comments.send();
      await flushPromises();

      expect(calls.map((call) => call.request.endpoint)).toEqual(["/uploads", "/comments"]);
    });

    it("should start a request added to an empty queue right away", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ queued: true });

      const first = request.send();
      await flushPromises();
      await calls[0].succeed();
      await first;
      request.send();
      await flushPromises();

      expect(calls).toHaveLength(2);
    });
  });

  describe("When requests are cancelable", () => {
    it("should abort the previous request when a new one is sent", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ cancelable: true });

      const first = request.send();
      await flushPromises();
      const second = request.send();
      await flushPromises();
      await calls[1].succeed("latest");

      expect(calls[0].isAborted()).toBe(true);
      await expect(first).resolves.toHaveProperty("error.message", "Request aborted");
      await expect(second).resolves.toHaveProperty("data", "latest");
    });

    it("should keep only the last of many requests sent in a row", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest({ cancelable: true });

      const sent = [1, 2, 3, 4, 5].map((payload) => request.send({ payload }));
      await flushPromises();
      const pending = calls.filter((call) => !call.isSettled());
      expect(pending).toHaveLength(1);
      expect(pending[0].request.payload).toBe(5);
      await pending[0].succeed("latest");
      const responses = await Promise.all(sent);

      expect(responses.map((response) => response.success)).toEqual([false, false, false, false, true]);
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });

    it("should not abort requests from other queues", async () => {
      const { createRequest, calls } = setup();
      const users = createRequest({ cancelable: true, endpoint: "/users" });
      const posts = createRequest({ cancelable: true, endpoint: "/posts" });

      users.send();
      posts.send();
      await flushPromises();

      expect(calls.map((call) => call.isAborted())).toEqual([false, false]);
    });

    it("should mark the response of the replaced request as canceled", async () => {
      const { client, createRequest } = setup();
      const request = createRequest({ cancelable: true });
      const canceled: boolean[] = [];
      client.requestManager.events.onResponse(({ details }) => canceled.push(details.isCanceled));

      const first = request.send();
      await flushPromises();
      request.send();
      await first;

      expect(canceled).toEqual([true]);
    });

    it("should resolve a replaced request which was waiting for the network", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest({ cancelable: true });
      client.appManager.setOnline(false);
      const onRemove = vi.fn();

      const first = request.send({ onRemove });
      await flushPromises();
      request.send();
      const response = await first;

      expect(calls).toHaveLength(0);
      expect(response.error?.message).toBe("Request deleted");
      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe("When requests are deduplicated", () => {
    it("should send one request for many identical calls", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ deduplicate: true });

      request.send();
      request.send();
      request.send();
      await flushPromises();

      expect(calls).toHaveLength(1);
    });

    it("should give every caller the same response", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ deduplicate: true });

      const sent = [request.send(), request.send(), request.send()];
      await flushPromises();
      await calls[0].succeed({ id: 1 });
      const responses = await Promise.all(sent);

      expect(responses.map((response) => response.data)).toEqual([{ id: 1 }, { id: 1 }, { id: 1 }]);
      expect(responses[1]).toBe(responses[0]);
      expect(responses[2]).toBe(responses[0]);
    });

    it("should give every caller the same error", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ deduplicate: true });

      const sent = [request.send(), request.send()];
      await flushPromises();
      await calls[0].fail({ message: "Shared failure" }, 503);
      const responses = await Promise.all(sent);

      expect(responses.map((response) => response.error)).toEqual([
        { message: "Shared failure" },
        { message: "Shared failure" },
      ]);
      expect(responses.map((response) => response.status)).toEqual([503, 503]);
    });

    it("should call the callbacks of every caller", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ deduplicate: true });
      const firstResponse = vi.fn();
      const secondResponse = vi.fn();

      const sent = [request.send({ onResponse: firstResponse }), request.send({ onResponse: secondResponse })];
      await flushPromises();
      await calls[0].succeed();
      await Promise.all(sent);

      expect(firstResponse).toHaveBeenCalledTimes(1);
      expect(secondResponse).toHaveBeenCalledTimes(1);
    });

    it("should tell that the request was deduplicated", async () => {
      const { client, createRequest } = setup();
      const request = createRequest({ deduplicate: true });
      const onDeduplicated = vi.fn();
      client.requestManager.events.onDeduplicated(onDeduplicated);

      request.send();
      request.send();
      request.send();
      await flushPromises();

      expect(onDeduplicated).toHaveBeenCalledTimes(2);
    });

    it("should send a new request once the previous one is finished", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ deduplicate: true });

      const first = request.send();
      await flushPromises();
      await calls[0].succeed("first");
      await first;
      const second = request.send();
      await flushPromises();
      await calls[1].succeed("second");

      expect(calls).toHaveLength(2);
      await expect(second).resolves.toHaveProperty("data", "second");
    });

    it("should not deduplicate requests with different query params", async () => {
      const { client, calls } = setup();
      const request = client.createRequest<{ queryParams: { page: number } }>()({
        endpoint: "/list",
        deduplicate: true,
      });

      request.send({ queryParams: { page: 1 } });
      request.send({ queryParams: { page: 2 } });
      request.send({ queryParams: { page: 1 } });
      await flushPromises();

      expect(calls).toHaveLength(2);
    });

    it("should not deduplicate requests with different params", async () => {
      const { client, calls } = setup();
      const request = client.createRequest()({ endpoint: "/users/:userId", deduplicate: true });

      request.send({ params: { userId: 1 } });
      request.send({ params: { userId: 2 } });
      await flushPromises();

      expect(calls).toHaveLength(2);
    });

    it("should deduplicate only within the deduplicateTime window", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ deduplicate: true, deduplicateTime: 100 });

      request.send();
      await vi.advanceTimersByTimeAsync(100);
      request.send();
      await flushPromises();
      expect(calls).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(1);
      request.send();
      await flushPromises();

      expect(calls).toHaveLength(2);
    });

    it("should deduplicate for the whole flight of the request when there is no window", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ deduplicate: true });

      request.send();
      await vi.advanceTimersByTimeAsync(60_000);
      request.send();
      await flushPromises();

      expect(calls).toHaveLength(1);
    });

    it("should abort the shared request for all callers", async () => {
      const { createRequest } = setup();
      const request = createRequest({ deduplicate: true });

      const sent = [request.send(), request.send()];
      await flushPromises();
      request.abort();
      const responses = await Promise.all(sent);

      expect(responses.map((response) => response.error?.message)).toEqual(["Request aborted", "Request aborted"]);
    });

    it("should deduplicate GET requests by default", async () => {
      const { client, calls } = setup();
      const request = client.createRequest()({ endpoint: "/default" });

      request.send();
      request.send();
      await flushPromises();

      expect(calls).toHaveLength(1);
    });

    it("should not deduplicate mutations by default", async () => {
      const { client, calls } = setup();
      const request = client.createRequest()({ endpoint: "/default", method: "POST" });

      request.send();
      request.send();
      await flushPromises();

      expect(calls).toHaveLength(2);
    });
  });

  describe("When the modes are mixed in one queue", () => {
    it("should queue a deduplicated request instead of sharing the response", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ queued: true, deduplicate: true });

      const first = request.send();
      const second = request.send();
      await flushPromises();
      expect(calls).toHaveLength(1);
      await calls[0].succeed("first");
      await flushPromises();
      await calls[1].succeed("second");

      await expect(first).resolves.toHaveProperty("data", "first");
      await expect(second).resolves.toHaveProperty("data", "second");
    });

    it("should queue a cancelable request instead of canceling the previous one", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ queued: true, cancelable: true });

      const first = request.send();
      request.send();
      await flushPromises();
      await calls[0].succeed("first");

      expect(calls[0].isAborted()).toBe(false);
      await expect(first).resolves.toHaveProperty("data", "first");
    });

    it("should cancel the previous request instead of joining it", async () => {
      const { createRequest, calls } = setup();
      const request = createRequest({ cancelable: true, deduplicate: true });

      const first = request.send();
      await flushPromises();
      request.send();
      await flushPromises();

      expect(calls).toHaveLength(2);
      await expect(first).resolves.toHaveProperty("error.message", "Request aborted");
    });
  });
});
