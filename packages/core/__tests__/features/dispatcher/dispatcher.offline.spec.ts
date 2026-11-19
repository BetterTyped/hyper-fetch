import { createControlledClient, flushPromises, isPending } from "../../utils/controlled-adapter.utils";

describe("Dispatcher [ Offline ]", () => {
  const setup = () => {
    const { client, calls, getPending } = createControlledClient();
    const createRequest = (options: { queued?: boolean; offline?: boolean; retry?: number; endpoint?: string } = {}) =>
      client.createRequest<{ response: unknown; payload: any }>()({
        endpoint: "/offline",
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

  describe("When requests are sent without a connection", () => {
    it("should keep them in the queue instead of sending", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest();
      client.appManager.setOnline(false);

      const sent = request.send();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(0);
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(1);
      expect(await isPending(sent)).toBe(true);
    });

    it("should send them when the connection is back", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest();
      client.appManager.setOnline(false);

      const sent = request.send();
      await flushPromises();
      client.appManager.setOnline(true);
      await flushPromises();
      await calls[0].succeed("synced");

      await expect(sent).resolves.toHaveProperty("data", "synced");
    });

    it("should send all the waiting requests of all queues", async () => {
      const { client, createRequest, calls } = setup();
      client.appManager.setOnline(false);

      createRequest({ endpoint: "/a" }).send();
      createRequest({ endpoint: "/b" }).send();
      createRequest({ endpoint: "/b" }).send();
      await flushPromises();
      client.appManager.setOnline(true);
      await flushPromises();

      expect(calls.map((call) => call.request.endpoint)).toEqual(["/a", "/b", "/b"]);
    });

    it("should send queued requests one by one in their order", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest({ queued: true });
      client.appManager.setOnline(false);

      const sent = [1, 2, 3].map((payload) => request.send({ payload }));
      await flushPromises();
      client.appManager.setOnline(true);
      for (let index = 0; index < 3; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await flushPromises();
        expect(calls).toHaveLength(index + 1);
        // eslint-disable-next-line no-await-in-loop
        await calls[index].succeed();
      }
      await Promise.all(sent);

      expect(calls.map((call) => call.request.payload)).toEqual([1, 2, 3]);
    });

    it("should not send anything twice when the connection comes back many times", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest();
      client.appManager.setOnline(false);

      request.send();
      await flushPromises();
      client.appManager.setOnline(true);
      client.appManager.setOnline(false);
      client.appManager.setOnline(true);
      client.appManager.setOnline(true);
      await flushPromises();

      expect(calls).toHaveLength(1);
    });

    it("should mark the loading events of a request sent after reconnecting as online", async () => {
      const { client, createRequest } = setup();
      const request = createRequest();
      const offline: boolean[] = [];
      client.requestManager.events.onLoading((event) => offline.push(event.isOffline));
      client.appManager.setOnline(false);

      request.send();
      await flushPromises();
      expect(offline).toEqual([]);
      client.appManager.setOnline(true);
      await flushPromises();

      expect(offline).toEqual([false]);
    });
  });

  describe("When the connection is lost during a request", () => {
    it("should keep a failed request and send it again after reconnecting", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest();
      const onResponse = vi.fn();

      const sent = request.send({ onResponse });
      await flushPromises();
      client.appManager.setOnline(false);
      await calls[0].fail({ message: "Network error" }, 0);

      expect(await isPending(sent)).toBe(true);
      expect(onResponse).not.toHaveBeenCalled();
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(1);

      client.appManager.setOnline(true);
      await flushPromises();
      await calls[1].succeed("synced");

      await expect(sent).resolves.toHaveProperty("data", "synced");
      expect(onResponse).toHaveBeenCalledTimes(1);
    });

    it("should use the response which arrived successfully despite going offline", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest();

      const sent = request.send();
      await flushPromises();
      client.appManager.setOnline(false);
      await calls[0].succeed("made it");

      await expect(sent).resolves.toHaveProperty("data", "made it");
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });

    it("should mark the response as received offline", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest();
      const offline: boolean[] = [];
      client.requestManager.events.onResponse(({ details }) => offline.push(details.isOffline));

      request.send();
      await flushPromises();
      client.appManager.setOnline(false);
      await calls[0].fail();

      expect(offline).toEqual([true]);
    });

    it("should hold the rest of a queue until the connection is back", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest({ queued: true });

      request.send({ payload: 1 });
      request.send({ payload: 2 });
      await flushPromises();
      client.appManager.setOnline(false);
      await calls[0].fail({ message: "Network error" }, 0);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(calls).toHaveLength(1);

      client.appManager.setOnline(true);
      await flushPromises();

      // The interrupted request goes first again
      expect(calls).toHaveLength(2);
      expect(calls[1].request.payload).toBe(1);
    });
  });

  describe("When the request is not kept for later with offline set to false", () => {
    it("should send it even without a connection", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest({ offline: false });
      client.appManager.setOnline(false);

      request.send();
      await flushPromises();

      expect(calls).toHaveLength(1);
    });

    it("should give the error right away instead of waiting for the connection", async () => {
      const { client, createRequest, calls, dispatcher } = setup();
      const request = createRequest({ offline: false });
      client.appManager.setOnline(false);

      const sent = request.send();
      await flushPromises();
      await calls[0].fail({ message: "Network error" }, 0);
      const response = await sent;
      client.appManager.setOnline(true);
      await flushPromises();

      expect(response.error).toEqual({ message: "Network error" });
      expect(calls).toHaveLength(1);
      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });

    it("should not retry it while there is no connection", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest({ offline: false, retry: 3 });
      client.appManager.setOnline(false);

      const sent = request.send();
      await flushPromises();
      await calls[0].fail();
      await sent;
      await vi.advanceTimersByTimeAsync(60_000);

      expect(calls).toHaveLength(1);
    });

    it("should give the error when the connection is lost during the request", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest({ offline: false });

      const sent = request.send();
      await flushPromises();
      client.appManager.setOnline(false);
      await calls[0].fail({ message: "Network error" }, 0);

      await expect(sent).resolves.toHaveProperty("error", { message: "Network error" });
    });

    it("should not block the queued requests behind it", async () => {
      const { client, createRequest, calls } = setup();
      const request = createRequest({ queued: true, offline: false });
      client.appManager.setOnline(false);

      const first = request.send({ payload: 1 });
      const second = request.send({ payload: 2 });
      await flushPromises();
      await calls[0].fail();
      await flushPromises();
      await calls[1].fail();
      const responses = await Promise.all([first, second]);

      expect(responses.map((response) => response.success)).toEqual([false, false]);
    });

    it("should send only the requests which do not wait for the connection from a mixed queue", async () => {
      const { client, createRequest, calls } = setup();
      const kept = createRequest({ offline: true });
      const immediate = createRequest({ offline: false });
      client.appManager.setOnline(false);

      kept.send({ payload: "kept" });
      immediate.send({ payload: "immediate" });
      await flushPromises();
      expect(calls.map((call) => call.request.payload)).toEqual(["immediate"]);

      client.appManager.setOnline(true);
      await flushPromises();

      expect(calls.map((call) => call.request.payload)).toEqual(["immediate", "kept"]);
    });
  });
});
