import { Cache } from "cache";
import { Dispatcher } from "dispatcher";
import { AppManager } from "managers";
import { createClient, interceptorCallback } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("Client [ Base ]", () => {
  let clientInstance = createClient();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    clientInstance = createClient();
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When client properties are passed", () => {
    it("should assign url", async () => {
      const url = "test-123";
      const client = createClient({ url });

      expect(client.url).toBe(url);
    });
    it("should assign new adapter", async () => {
      const adapter = () => interceptorCallback()();
      const client = createClient({ adapter });

      expect(client.adapter).toBe(adapter);
    });
    it("should assign new appManager", async () => {
      const appManager = new AppManager(clientInstance);
      const client = createClient({ appManager: () => appManager });

      expect(client.appManager).toBe(appManager);
    });
    it("should assign new cache", async () => {
      const cache = new Cache(clientInstance);
      const client = createClient({ cache: () => cache });

      expect(client.cache).toBe(cache);
    });
    it("should assign new fetchDispatcher", async () => {
      const fetchDispatcher = new Dispatcher(clientInstance);
      const client = createClient({ fetchDispatcher: () => fetchDispatcher });

      expect(client.fetchDispatcher).toBe(fetchDispatcher);
    });
    it("should assign new submitDispatcher", async () => {
      const submitDispatcher = new Dispatcher(clientInstance);
      const client = createClient({ submitDispatcher: () => submitDispatcher });

      expect(client.submitDispatcher).toBe(submitDispatcher);
    });
  });
  describe("When client is getting cleared", () => {
    it("should assign new appManager", async () => {
      const spy = jest.fn();
      const appManager = new AppManager(clientInstance);
      const client = createClient({
        appManager: () => {
          spy();
          return appManager;
        },
      });
      expect(spy).toBeCalledTimes(1);
      client.clear();
      expect(spy).toBeCalledTimes(2);
    });
    it("should assign new cache", async () => {
      const spy = jest.fn();
      const cache = new Cache(clientInstance);
      const client = createClient({
        cache: () => {
          spy();
          return cache;
        },
      });

      expect(spy).toBeCalledTimes(1);
      client.clear();
      expect(spy).toBeCalledTimes(2);
    });
    it("should assign new fetchDispatcher", async () => {
      const spy = jest.fn();
      const fetchDispatcher = new Dispatcher(clientInstance);
      const client = createClient({
        fetchDispatcher: () => {
          spy();
          return fetchDispatcher;
        },
      });

      expect(spy).toBeCalledTimes(1);
      client.clear();
      expect(spy).toBeCalledTimes(2);
    });
    it("should assign new submitDispatcher", async () => {
      const spy = jest.fn();
      const submitDispatcher = new Dispatcher(clientInstance);
      const client = createClient({
        submitDispatcher: () => {
          spy();
          return submitDispatcher;
        },
      });

      expect(spy).toBeCalledTimes(1);
      client.clear();
      expect(spy).toBeCalledTimes(2);
    });
  });
});
