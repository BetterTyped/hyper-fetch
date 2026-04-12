import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import type { QueueDataType } from "dispatcher";
import { Dispatcher } from "dispatcher";
import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

/**
 * Creates a JSON-serializing storage that mimics MMKV, AsyncStorage, or any
 * persistence layer where values go through JSON.stringify / JSON.parse.
 *
 * This is the scenario reported in GitHub issue #125: requests stay pending
 * forever because the Request class instances lose their identity (methods,
 * `client` reference, etc.) after a serialize/deserialize round-trip.
 */
const createSerializingStorage = () => {
  const store = new Map<string, string>();

  return {
    set: (key: string, data: QueueDataType<any>) => {
      store.set(key, JSON.stringify(data));
    },
    get: (key: string) => {
      const value = store.get(key);
      return value ? JSON.parse(value) : undefined;
    },
    keys: () => Array.from(store.keys()),
    entries: () => {
      return Array.from(
        store.entries(),
        ([key, value]) => [key, JSON.parse(value)] as [string, QueueDataType<any>],
      ).values();
    },
    delete: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
};

describe("Dispatcher [ Custom Serializing Storage - Issue #125 ]", () => {
  let client: Client;
  let storage: ReturnType<typeof createSerializingStorage>;
  let dispatcher: Dispatcher<any>;

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    resetMocks();
    storage = createSerializingStorage();
    client = new Client({
      url: "shared-base-url",
      fetchDispatcher: () => new Dispatcher({ storage }),
    });
    dispatcher = client.fetchDispatcher;
  });

  afterAll(() => {
    stopServer();
  });

  describe("When adding requests with serializing storage", () => {
    it("should successfully send requests and receive responses", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const fetchSpy = vi.spyOn(client.adapter, "fetch");

      dispatcher.add(request);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });
    });

    it("should not leave requests in pending state", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const loadingSpy = vi.fn();
      client.requestManager.events.onLoadingByQueue(request.queryKey, loadingSpy);

      dispatcher.add(request);

      await waitFor(() => {
        expect(loadingSpy).toHaveBeenCalledTimes(2);
        expect(loadingSpy).toHaveBeenLastCalledWith(expect.objectContaining({ loading: false }));
      });
    });

    it("should handle multiple concurrent requests with serializing storage", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const fetchSpy = vi.spyOn(client.adapter, "fetch");

      dispatcher.add(request);
      dispatcher.add(request);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });
    });

    it("should handle queued requests with serializing storage", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queued: true });
      mockRequest(request, { delay: 5 });

      const fetchSpy = vi.spyOn(client.adapter, "fetch");

      dispatcher.add(request);
      dispatcher.add(request);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });
    });

    it("should remove completed requests from queue after response", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      dispatcher.add(request);

      await waitFor(() => {
        expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });
    });

    it("should work with flush after going offline and back online", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const fetchSpy = vi.spyOn(client.adapter, "fetch");

      client.appManager.setOnline(false);
      dispatcher.add(request);

      await sleep(5);
      expect(fetchSpy).toHaveBeenCalledTimes(0);

      client.appManager.setOnline(true);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });

    it("should handle retries with serializing storage", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", retry: 1, retryTime: 0 });
      mockRequest(request, { status: 400, delay: 0 });

      const fetchSpy = vi.spyOn(client.adapter, "fetch");
      dispatcher.add(request);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("When using submitDispatcher with serializing storage", () => {
    it("should work with submit dispatcher using serializing storage", async () => {
      const submitStorage = createSerializingStorage();
      const submitClient = new Client({
        url: "shared-base-url",
        submitDispatcher: () => new Dispatcher({ storage: submitStorage }),
      });

      const request = submitClient.createRequest()({ endpoint: "shared-base-endpoint", method: "POST" });
      mockRequest(request);

      const fetchSpy = vi.spyOn(submitClient.adapter, "fetch");

      submitClient.submitDispatcher.add(request);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(submitClient.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });
    });
  });
});
