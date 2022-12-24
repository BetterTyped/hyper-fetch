import { Cache } from "cache";
import { Dispatcher } from "dispatcher";
import { AppManager } from "managers";
import { createBuilder, interceptorCallback } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("Builder [ Base ]", () => {
  let builderInstance = createBuilder();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    builderInstance = createBuilder();
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When builder properties are passed", () => {
    it("should assign url", async () => {
      const url = "test-123";
      const builder = createBuilder({ url });

      expect(builder.url).toBe(url);
    });
    it("should assign new client", async () => {
      const client = () => interceptorCallback()();
      const builder = createBuilder({ client });

      expect(builder.client).toBe(client);
    });
    it("should assign new appManager", async () => {
      const appManager = new AppManager(builderInstance);
      const builder = createBuilder({ appManager: () => appManager });

      expect(builder.appManager).toBe(appManager);
    });
    it("should assign new cache", async () => {
      const cache = new Cache(builderInstance);
      const builder = createBuilder({ cache: () => cache });

      expect(builder.cache).toBe(cache);
    });
    it("should assign new fetchDispatcher", async () => {
      const fetchDispatcher = new Dispatcher(builderInstance);
      const builder = createBuilder({ fetchDispatcher: () => fetchDispatcher });

      expect(builder.fetchDispatcher).toBe(fetchDispatcher);
    });
    it("should assign new submitDispatcher", async () => {
      const submitDispatcher = new Dispatcher(builderInstance);
      const builder = createBuilder({ submitDispatcher: () => submitDispatcher });

      expect(builder.submitDispatcher).toBe(submitDispatcher);
    });
  });
  describe("When builder is getting cleared", () => {
    it("should assign new appManager", async () => {
      const spy = jest.fn();
      const appManager = new AppManager(builderInstance);
      const builder = createBuilder({
        appManager: () => {
          spy();
          return appManager;
        },
      });
      expect(spy).toBeCalledTimes(1);
      builder.clear();
      expect(spy).toBeCalledTimes(2);
    });
    it("should assign new cache", async () => {
      const spy = jest.fn();
      const cache = new Cache(builderInstance);
      const builder = createBuilder({
        cache: () => {
          spy();
          return cache;
        },
      });

      expect(spy).toBeCalledTimes(1);
      builder.clear();
      expect(spy).toBeCalledTimes(2);
    });
    it("should assign new fetchDispatcher", async () => {
      const spy = jest.fn();
      const fetchDispatcher = new Dispatcher(builderInstance);
      const builder = createBuilder({
        fetchDispatcher: () => {
          spy();
          return fetchDispatcher;
        },
      });

      expect(spy).toBeCalledTimes(1);
      builder.clear();
      expect(spy).toBeCalledTimes(2);
    });
    it("should assign new submitDispatcher", async () => {
      const spy = jest.fn();
      const submitDispatcher = new Dispatcher(builderInstance);
      const builder = createBuilder({
        submitDispatcher: () => {
          spy();
          return submitDispatcher;
        },
      });

      expect(spy).toBeCalledTimes(1);
      builder.clear();
      expect(spy).toBeCalledTimes(2);
    });
  });
});
