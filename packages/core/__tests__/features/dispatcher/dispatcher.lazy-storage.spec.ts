import { createHttpMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import { Client } from "client";
import type { DispatcherAsyncStorageType, QueueDataType } from "dispatcher";
import { Dispatcher } from "dispatcher";
import { AppManager, LoggerManager } from "managers";
import { exponentialBackoff } from "request";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

/**
 * Async storage like IndexedDB - values are structured clones, so functions and class instances can't be stored, and
 * every operation resolves later
 */
const createLazyStorage = () => {
  const store = new Map<string, QueueDataType>();
  let readGate: Promise<void> = Promise.resolve();
  const later = () =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

  const storage: DispatcherAsyncStorageType = {
    set: async (key, data) => {
      const value = structuredClone(data);
      await later();
      store.set(key, value);
    },
    get: async (key) => {
      await readGate;
      await later();
      return store.get(key) as never;
    },
    keys: async () => {
      await readGate;
      return [...store.keys()];
    },
    delete: async (key) => {
      await later();
      store.delete(key);
    },
  };

  const holdReads = () => {
    let release: VoidFunction = () => undefined;
    readGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    return release;
  };

  return { storage, store, holdReads };
};

type LazyStorage = ReturnType<typeof createLazyStorage>;

const createAppClient = (lazy: LazyStorage, online = true) =>
  new Client({
    url: "http://lazy-queue.test",
    appManager: () => new AppManager({ initiallyOnline: online }),
    submitDispatcher: () => new Dispatcher({ lazyStorage: lazy.storage }),
  });

const createPostRequest = (client: Client, endpoint = "/users") =>
  client.createRequest<{ response: { id: number }; payload: { name: string } }>()({
    endpoint,
    method: "POST",
    offline: true,
  });

const getPersistedRequests = (lazy: LazyStorage) => [...lazy.store.values()].flatMap((queue) => queue.requests);

describe("Dispatcher [ Lazy storage ]", () => {
  let lazy = createLazyStorage();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    lazy = createLazyStorage();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When the queue changes", () => {
    it("should save the queued requests as serializable data", async () => {
      const client = createAppClient(lazy, false);
      const request = createPostRequest(client)
        .setPayload({ name: "John" })
        .setRetryTime(exponentialBackoff())
        .setResponseMapper((response) => response);

      client.submitDispatcher.add(request);

      await waitFor(() => {
        expect(getPersistedRequests(lazy)).toHaveLength(1);
      });
      const [persisted] = getPersistedRequests(lazy);
      expect(persisted.request).toMatchObject({ payload: { name: "John" } });
    });

    it("should remove the request once it succeeds", async () => {
      const client = createAppClient(lazy);
      const request = createPostRequest(client).setPayload({ name: "John" });
      mockRequest(request, { data: { id: 1 }, delay: 5 });

      await client.submitDispatcher.add(request);
      await waitFor(() => {
        expect(lazy.store.size).toBe(1);
      });

      await waitFor(() => {
        expect(getPersistedRequests(lazy)).toHaveLength(0);
      });
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });

    it("should remove every queue on clear", async () => {
      const client = createAppClient(lazy, false);
      client.submitDispatcher.add(createPostRequest(client).setPayload({ name: "John" }));
      client.submitDispatcher.add(createPostRequest(client, "/posts").setPayload({ name: "Post" }));
      await waitFor(() => {
        expect(lazy.store.size).toBe(2);
      });

      client.submitDispatcher.clear();

      await waitFor(() => {
        expect(lazy.store.size).toBe(0);
      });
    });
  });

  describe("When the client starts", () => {
    it("should send the requests restored from the lazy storage", async () => {
      const previousClient = createAppClient(lazy, false);
      previousClient.submitDispatcher.add(createPostRequest(previousClient).setPayload({ name: "John" }));
      await waitFor(() => {
        expect(getPersistedRequests(lazy)).toHaveLength(1);
      });

      const client = createAppClient(lazy);
      mockRequest(createPostRequest(client), { data: { id: 1 }, delay: 0 });
      const fetchSpy = vi.spyOn(client.adapter, "fetch");

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
      expect(fetchSpy.mock.calls[0][0].payload).toStrictEqual({ name: "John" });
      await waitFor(() => {
        expect(getPersistedRequests(lazy)).toHaveLength(0);
      });
    });

    it("should keep the requests added before the restore finished", async () => {
      const previousClient = createAppClient(lazy, false);
      previousClient.submitDispatcher.add(createPostRequest(previousClient).setPayload({ name: "Restored" }));
      await waitFor(() => {
        expect(getPersistedRequests(lazy)).toHaveLength(1);
      });

      const release = lazy.holdReads();
      const client = createAppClient(lazy, false);
      client.submitDispatcher.add(createPostRequest(client).setPayload({ name: "New" }));
      release();

      await waitFor(() => {
        const [queue] = client.submitDispatcher.getQueuesKeys().map((key) => client.submitDispatcher.getQueue(key));
        expect(queue.requests.map(({ request }) => request.payload)).toStrictEqual([
          { name: "Restored" },
          { name: "New" },
        ]);
      });
      await waitFor(() => {
        expect(getPersistedRequests(lazy).map(({ request }) => (request as { payload: unknown }).payload)).toStrictEqual(
          [{ name: "Restored" }, { name: "New" }],
        );
      });
    });

    it("should keep the restored requests while the app starts offline", async () => {
      const previousClient = createAppClient(lazy, false);
      previousClient.submitDispatcher.add(createPostRequest(previousClient).setPayload({ name: "John" }));
      await waitFor(() => {
        expect(getPersistedRequests(lazy)).toHaveLength(1);
      });

      const client = createAppClient(lazy, false);
      const fetchSpy = vi.spyOn(client.adapter, "fetch");
      await waitFor(() => {
        expect(client.submitDispatcher.getQueuesKeys()).toHaveLength(1);
      });
      expect(fetchSpy).not.toHaveBeenCalled();

      mockRequest(createPostRequest(client), { data: { id: 1 }, delay: 0 });
      client.appManager.setOnline(true);
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("When the lazy storage fails", () => {
    it("should log the failure and still send the request", async () => {
      const failingStorage: DispatcherAsyncStorageType = {
        set: async () => {
          throw new Error("Quota exceeded");
        },
        get: async () => undefined,
        keys: async () => [],
        delete: async () => undefined,
      };
      const logger = vi.fn();
      const client = new Client({
        url: "http://lazy-queue.test",
        submitDispatcher: () => new Dispatcher({ lazyStorage: failingStorage }),
      })
        .setDebug(true)
        .setLogger(() => new LoggerManager({ logger }));
      const request = createPostRequest(client).setPayload({ name: "John" });
      mockRequest(request, { data: { id: 1 }, delay: 0 });

      const response = await request.send();

      expect(response.data).toStrictEqual({ id: 1 });
      await waitFor(() => {
        expect(logger).toHaveBeenCalledWith(
          expect.objectContaining({ level: "error", module: "Dispatcher", title: 'Lazy storage "set" failed' }),
        );
      });
    });
  });
});
