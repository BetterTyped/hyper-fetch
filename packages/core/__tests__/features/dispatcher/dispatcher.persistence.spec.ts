import { createHttpMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import { Client } from "client";
import type { QueueDataType } from "dispatcher";
import { Dispatcher } from "dispatcher";
import { AppManager } from "managers";
import { http, HttpResponse } from "msw";

const { resetMocks, startServer, stopServer, mockRequest, server } = createHttpMockingServer();

/**
 * Persistent storage like localStorage - it outlives the client, so a new client (page reload) reads what the
 * previous one left behind.
 */
const createPersistentStorage = () => {
  const store = new Map<string, string>();

  return {
    set: (key: string, data: QueueDataType<any>) => {
      store.set(key, JSON.stringify(data));
    },
    get: (key: string) => {
      const value = store.get(key);
      return value ? JSON.parse(value) : undefined;
    },
    keys: () => [...store.keys()],
    entries: () =>
      Array.from(store.entries(), ([key, value]) => [key, JSON.parse(value)] as [string, QueueDataType<any>]).values(),
    delete: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
};

type PersistentStorage = ReturnType<typeof createPersistentStorage>;

const createAppClient = (storage: PersistentStorage, online = true) =>
  new Client({
    url: "http://persisted.test",
    appManager: () => new AppManager({ initiallyOnline: online }),
    submitDispatcher: () => new Dispatcher({ storage }),
  });

const createPostRequest = (client: Client) =>
  client.createRequest<{ response: { id: number }; payload: { name: string } }>()({
    endpoint: "/users",
    method: "POST",
    offline: true,
  });

describe("Dispatcher [ Persistence ]", () => {
  let storage: PersistentStorage;

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    storage = createPersistentStorage();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When the client starts with a queue restored from the storage", () => {
    it("should send the restored requests without waiting for the network to come back", async () => {
      // Previous session - the request was queued while offline and the page was closed
      const previousClient = createAppClient(storage, false);
      previousClient.submitDispatcher.add(createPostRequest(previousClient).setPayload({ name: "John" }));
      expect(storage.keys()).toHaveLength(1);

      // New session starts online - there is no online event to trigger the flush
      const client = createAppClient(storage, true);
      mockRequest(createPostRequest(client), { data: { id: 1 }, delay: 0 });
      const fetchSpy = vi.spyOn(client.adapter, "fetch");

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        const [queryKey] = storage.keys();
        expect(storage.get(queryKey)?.requests).toHaveLength(0);
      });
      expect(fetchSpy.mock.calls[0][0].payload).toStrictEqual({ name: "John" });
    });

    it("should send the restored requests with the configuration applied after the constructor", async () => {
      const previousClient = createAppClient(storage, false);
      previousClient.submitDispatcher.add(createPostRequest(previousClient).setPayload({ name: "John" }));

      // Interceptors are added right after the client gets created - the restored requests must go through them
      const onRequest = vi.fn((request) => request);
      const client = createAppClient(storage, true).onRequest(onRequest);
      mockRequest(createPostRequest(client), { data: { id: 1 }, delay: 0 });

      await waitFor(() => {
        expect(onRequest).toHaveBeenCalledTimes(1);
      });
    });

    it("should keep the restored requests while the app starts offline", async () => {
      const previousClient = createAppClient(storage, false);
      previousClient.submitDispatcher.add(createPostRequest(previousClient).setPayload({ name: "John" }));

      const client = createAppClient(storage, false);
      mockRequest(createPostRequest(client), { data: { id: 1 }, delay: 0 });
      const fetchSpy = vi.spyOn(client.adapter, "fetch");

      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      expect(fetchSpy).not.toHaveBeenCalled();

      client.appManager.setOnline(true);
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("When the page unloads while a request is in flight", () => {
    it("should keep the request in the persisted queue and send it on the next start", async () => {
      const client = createAppClient(storage, true);
      let release: VoidFunction = () => undefined;
      const until = new Promise<void>((resolve) => {
        release = resolve;
      });
      // The browser cancels the fetch of an unloading page - it ends with a network error
      server.use(
        http.post("http://persisted.test/users", async () => {
          await until;
          return HttpResponse.error();
        }),
      );

      const request = createPostRequest(client).setPayload({ name: "John" });
      const onResponse = vi.fn();
      client.requestManager.events.onResponse(onResponse);
      client.submitDispatcher.add(request);

      await waitFor(() => {
        expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(1);
      });

      window.dispatchEvent(new Event("pagehide"));
      release();

      await waitFor(() => {
        expect(onResponse).toHaveBeenCalledTimes(1);
      });
      const [queryKey] = storage.keys();
      expect(storage.get(queryKey)?.requests).toHaveLength(1);

      // Next page load
      resetMocks();
      const nextClient = createAppClient(storage, true);
      mockRequest(createPostRequest(nextClient), { data: { id: 1 }, delay: 0 });
      const fetchSpy = vi.spyOn(nextClient.adapter, "fetch");

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(storage.get(queryKey)?.requests).toHaveLength(0);
      });
    });

    it("should handle the failures normally again when the page is shown from the back-forward cache", async () => {
      const client = createAppClient(storage, true);
      mockRequest(createPostRequest(client), { status: 400, delay: 0 });

      window.dispatchEvent(new Event("pagehide"));
      window.dispatchEvent(new Event("pageshow"));

      const onResponse = vi.fn();
      client.requestManager.events.onResponse(onResponse);
      client.submitDispatcher.add(createPostRequest(client).setPayload({ name: "John" }));

      await waitFor(() => {
        expect(onResponse).toHaveBeenCalledTimes(1);
      });
      const [queryKey] = storage.keys();
      expect(storage.get(queryKey)?.requests).toHaveLength(0);
    });
  });
});
