import { Client } from "client";
import type { QueueDataType } from "dispatcher";
import { Dispatcher } from "dispatcher";

import { createControlledClient, flushPromises, isPending } from "../../utils/controlled-adapter.utils";

describe("Dispatcher [ Control ]", () => {
  const setup = () => {
    const { client, calls } = createControlledClient();
    const createRequest = (options: { queued?: boolean; endpoint?: string } = {}) =>
      client.createRequest<{ response: any; payload: any }>()({ endpoint: "/control", method: "POST", ...options });

    return { client, calls, createRequest, dispatcher: client.submitDispatcher };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("When the queue is paused", () => {
    it("should let the running request finish", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      const sent = request.send();
      await flushPromises();
      dispatcher.pause(request.queryKey);
      await calls[0].succeed("finished");

      expect(calls[0].isAborted()).toBe(false);
      await expect(sent).resolves.toHaveProperty("data", "finished");
    });

    it("should hold the requests added later until the queue is started", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();
      dispatcher.pause(request.queryKey);

      const sent = request.send();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(calls).toHaveLength(0);
      expect(await isPending(sent)).toBe(true);

      dispatcher.start(request.queryKey);
      await flushPromises();
      await calls[0].succeed("started");

      await expect(sent).resolves.toHaveProperty("data", "started");
    });

    it("should hold the next queued request after the running one is done", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest({ queued: true });

      request.send({ payload: 1 });
      request.send({ payload: 2 });
      await flushPromises();
      dispatcher.pause(request.queryKey);
      await calls[0].succeed();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(calls).toHaveLength(1);

      dispatcher.start(request.queryKey);
      await flushPromises();

      expect(calls.map((call) => call.request.payload)).toEqual([1, 2]);
    });

    it("should not pause other queues", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const paused = createRequest({ endpoint: "/paused" });
      const running = createRequest({ endpoint: "/running" });
      dispatcher.pause(paused.queryKey);

      paused.send();
      running.send();
      await flushPromises();

      expect(calls.map((call) => call.request.endpoint)).toEqual(["/running"]);
    });

    it("should tell that the queue is not active", () => {
      const { createRequest, dispatcher } = setup();
      const request = createRequest();

      request.send();
      expect(dispatcher.getIsActiveQueue(request.queryKey)).toBe(true);
      dispatcher.pause(request.queryKey);

      expect(dispatcher.getIsActiveQueue(request.queryKey)).toBe(false);
      expect(dispatcher.getQueue(request.queryKey).stopped).toBe(true);
    });
  });

  describe("When the queue is stopped", () => {
    it("should abort the running request and keep it in the queue", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      request.send();
      await flushPromises();
      dispatcher.stop(request.queryKey);
      await flushPromises();

      expect(calls[0].isAborted()).toBe(true);
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(1);
      expect(dispatcher.getRunningRequests(request.queryKey)).toHaveLength(0);
    });

    it("should send the kept request again when the queue is started", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      request.send();
      await flushPromises();
      dispatcher.stop(request.queryKey);
      await flushPromises();
      dispatcher.start(request.queryKey);
      await flushPromises();
      await calls[1].succeed();
      await flushPromises();

      expect(calls).toHaveLength(2);
      expect(calls[1].requestId).toBe(calls[0].requestId);
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });

    it("should keep the order of a queue which was stopped and started", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest({ queued: true });

      request.send({ payload: 1 });
      request.send({ payload: 2 });
      request.send({ payload: 3 });
      await flushPromises();
      dispatcher.stop(request.queryKey);
      await flushPromises();
      dispatcher.start(request.queryKey);
      for (let index = 1; index <= 3; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await flushPromises();
        // eslint-disable-next-line no-await-in-loop
        await calls[index].succeed();
      }

      expect(calls.map((call) => call.request.payload)).toEqual([1, 1, 2, 3]);
    });

    it("should not start anything when an empty queue is stopped and started", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      dispatcher.stop(request.queryKey);
      dispatcher.start(request.queryKey);
      await flushPromises();

      expect(calls).toHaveLength(0);
      expect(dispatcher.getQueue(request.queryKey)).toEqual({
        queryKey: request.queryKey,
        requests: [],
        stopped: false,
      });
    });
  });

  describe("When a single request is stopped", () => {
    it("should abort it and let the others go on", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest({ queued: true });

      request.send({ payload: 1 });
      request.send({ payload: 2 });
      await flushPromises();
      dispatcher.stopRequest(request.queryKey, calls[0].requestId);
      await flushPromises();

      expect(calls[0].isAborted()).toBe(true);
      expect(calls.map((call) => call.request.payload)).toEqual([1, 2]);
      expect(dispatcher.getQueue(request.queryKey).requests.map((item) => item.stopped)).toEqual([true, false]);
    });

    it("should send it again when it is started", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      request.send();
      await flushPromises();
      dispatcher.stopRequest(request.queryKey, calls[0].requestId);
      await flushPromises();
      dispatcher.startRequest(request.queryKey, calls[0].requestId);
      await flushPromises();

      expect(calls).toHaveLength(2);
      expect(calls[1].requestId).toBe(calls[0].requestId);
    });

    it("should not send a stopped request when the queue is flushed", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      request.send();
      await flushPromises();
      dispatcher.stopRequest(request.queryKey, calls[0].requestId);
      await flushPromises();
      dispatcher.flush();
      dispatcher.flushQueue(request.queryKey);
      await flushPromises();

      expect(calls).toHaveLength(1);
    });

    it("should ignore unknown requests", () => {
      const { createRequest, dispatcher } = setup();
      const request = createRequest();
      const onStatusChange = vi.fn();
      dispatcher.events.onQueueStatusChange(onStatusChange);

      dispatcher.stopRequest(request.queryKey, "unknown");
      dispatcher.startRequest(request.queryKey, "unknown");

      expect(onStatusChange).not.toHaveBeenCalled();
    });
  });

  describe("When listening to the queue events", () => {
    it("should tell about every change of the queue in order", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();
      const events: string[] = [];
      dispatcher.events.onQueueChangeByKey(request.queryKey, ({ requests }) =>
        events.push(`change:${requests.length}`),
      );
      dispatcher.events.onRunningRequestsChangeByKey(request.queryKey, ({ runningRequests }) =>
        events.push(`running:${runningRequests.length}`),
      );
      dispatcher.events.onDrainedByKey(request.queryKey, () => events.push("drained"));

      const sent = request.send();
      await flushPromises();
      await calls[0].succeed();
      await sent;
      await flushPromises();

      expect(events).toEqual(["change:1", "running:1", "running:0", "change:0", "drained"]);
    });

    it("should tell about the status changes", () => {
      const { createRequest, dispatcher } = setup();
      const request = createRequest();
      const statuses: boolean[] = [];
      dispatcher.events.onQueueStatusChangeByKey(request.queryKey, ({ stopped }) => statuses.push(stopped));

      dispatcher.pause(request.queryKey);
      dispatcher.start(request.queryKey);
      dispatcher.stop(request.queryKey);
      dispatcher.start(request.queryKey);

      expect(statuses).toEqual([true, false, true, false]);
    });

    it("should count the requests sent from a queue", async () => {
      const { createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      request.send();
      request.send();
      await flushPromises();
      await calls[0].succeed();

      expect(dispatcher.getQueueRequestCount(request.queryKey)).toBe(2);
      expect(dispatcher.getQueueRequestCount("unknown")).toBe(0);
    });
  });

  describe("When the queue is kept in a serializing storage", () => {
    const createStorage = () => {
      const store = new Map<string, string>();
      return {
        store,
        set: (key: string, data: QueueDataType<any>) => {
          store.set(key, JSON.stringify(data));
        },
        get: (key: string) => {
          const value = store.get(key);
          return value ? JSON.parse(value) : undefined;
        },
        keys: () => [...store.keys()],
        entries: () => [...store.entries()].map(([key, value]) => [key, JSON.parse(value)] as [string, any]).values(),
        delete: (key: string) => store.delete(key),
        clear: () => store.clear(),
      };
    };

    const setupStorage = () => {
      const storage = createStorage();
      const controlled = createControlledClient({ submitDispatcher: () => new Dispatcher({ storage }) });
      const request = controlled.client.createRequest<{ response: any; payload: any; queryParams: any }>()({
        endpoint: "/stored/:id",
        method: "POST",
      });
      return { ...controlled, storage, request, dispatcher: controlled.client.submitDispatcher };
    };

    it("should save a waiting request with all its values", () => {
      const { client, storage, request } = setupStorage();
      client.appManager.setOnline(false);

      request.send({ params: { id: 1 }, payload: { name: "John" }, queryParams: { page: 2 } });
      const [queue] = [...storage.store.values()].map((value) => JSON.parse(value));

      expect(queue.requests).toHaveLength(1);
      expect(queue.requests[0].request).toMatchObject({
        endpoint: "/stored/1",
        method: "POST",
        params: { id: 1 },
        payload: { name: "John" },
        queryParams: { page: 2 },
      });
    });

    it("should send the request restored from the storage", async () => {
      const { client, calls, request } = setupStorage();
      client.appManager.setOnline(false);

      const sent = request.send({ params: { id: 1 }, payload: { name: "John" }, queryParams: { page: 2 } });
      client.appManager.setOnline(true);
      await flushPromises();
      expect(calls[0].request.endpoint).toBe("/stored/1");
      expect(calls[0].request.payload).toEqual({ name: "John" });
      await calls[0].succeed("stored");

      await expect(sent).resolves.toHaveProperty("data", "stored");
    });

    it("should remove the finished request from the storage", async () => {
      const { calls, storage, request } = setupStorage();

      const sent = request.send({ params: { id: 1 }, payload: null, queryParams: null });
      await flushPromises();
      await calls[0].succeed();
      await sent;

      expect([...storage.store.values()].map((value) => JSON.parse(value).requests)).toEqual([[]]);
    });

    it("should save the number of the used attempts", async () => {
      const { calls, storage, request } = setupStorage();

      request
        .setRetry(3)
        .setRetryTime(1000)
        .send({ params: { id: 1 }, payload: null, queryParams: null });
      await flushPromises();
      await calls[0].fail();
      const [queue] = [...storage.store.values()].map((value) => JSON.parse(value));

      expect(queue.requests[0].retries).toBe(1);
    });

    it("should pick up the queue saved by a previous client", async () => {
      const storage = createStorage();
      const previous = new Client({ url: "http://controlled", submitDispatcher: () => new Dispatcher({ storage }) });
      previous.appManager.setOnline(false);
      previous
        .createRequest<{ payload: any }>()({ endpoint: "/stored/:id", method: "POST" })
        .send({ params: { id: 5 }, payload: { saved: true } } as never);

      const { client, calls } = createControlledClient({ submitDispatcher: () => new Dispatcher({ storage }) });
      client.submitDispatcher.flush();
      await flushPromises();

      expect(calls).toHaveLength(1);
      expect(calls[0].request.endpoint).toBe("/stored/5");
      expect(calls[0].request.payload).toEqual({ saved: true });
    });
  });
});
