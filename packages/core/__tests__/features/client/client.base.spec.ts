import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Cache } from "cache";
import { Dispatcher } from "dispatcher";
import { AppManager } from "managers";
import { Client } from "client";
import { Adapter } from "adapter";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Client [ Base ]", () => {
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When client properties are passed", () => {
    it("should assign url", async () => {
      const url = "test-123";
      const client = new Client({ url });

      expect(client.url).toBe(url);
    });
    it("should assign new adapter", async () => {
      const adapter = new Adapter({
        name: "test",
        defaultMethod: "GET",
        defaultExtra: {},
        systemErrorStatus: 0,
        systemErrorExtra: {},
      });
      const client = new Client({ url: "shared-base-url" }).setAdapter(adapter);

      expect(client.adapter).toBe(adapter);
    });
    it("should assign new appManager", async () => {
      const appManager = new AppManager();
      const client = new Client({ url: "shared-base-url", appManager: () => appManager });

      expect(client.appManager).toBe(appManager);
    });
    it("should assign new cache", async () => {
      const cache = new Cache();
      const client = new Client({ url: "shared-base-url", cache: () => cache });

      expect(client.cache).toBe(cache);
    });
    it("should assign new fetchDispatcher", async () => {
      const fetchDispatcher = new Dispatcher();
      const client = new Client({ url: "shared-base-url", fetchDispatcher: () => fetchDispatcher });

      expect(client.fetchDispatcher).toBe(fetchDispatcher);
    });
    it("should assign new submitDispatcher", async () => {
      const submitDispatcher = new Dispatcher();
      const client = new Client({ url: "shared-base-url", submitDispatcher: () => submitDispatcher });

      expect(client.submitDispatcher).toBe(submitDispatcher);
    });
  });
  describe("When client is getting cleared", () => {
    it("should assign new appManager", async () => {
      const spy = jest.fn();
      const appManager = new AppManager();
      const client = new Client({
        url: "shared-base-url",
        appManager: () => {
          spy();
          return appManager;
        },
      });
      expect(spy).toHaveBeenCalledTimes(1);
      client.clear();
      expect(spy).toHaveBeenCalledTimes(2);
    });
    it("should assign new cache", async () => {
      const spy = jest.fn();
      const cache = new Cache();
      const client = new Client({
        url: "shared-base-url",
        cache: () => {
          spy();
          return cache;
        },
      });

      expect(spy).toHaveBeenCalledTimes(1);
      client.clear();
      expect(spy).toHaveBeenCalledTimes(2);
    });
    it("should assign new fetchDispatcher", async () => {
      const spy = jest.fn();
      const fetchDispatcher = new Dispatcher();
      const client = new Client({
        url: "shared-base-url",
        fetchDispatcher: () => {
          spy();
          return fetchDispatcher;
        },
      });

      expect(spy).toHaveBeenCalledTimes(1);
      client.clear();
      expect(spy).toHaveBeenCalledTimes(2);
    });
    it("should assign new submitDispatcher", async () => {
      const spy = jest.fn();
      const submitDispatcher = new Dispatcher();
      const client = new Client({
        url: "shared-base-url",
        submitDispatcher: () => {
          spy();
          return submitDispatcher;
        },
      });

      expect(spy).toHaveBeenCalledTimes(1);
      client.clear();
      expect(spy).toHaveBeenCalledTimes(2);
    });
    it("should assign new defaultExtra", async () => {
      const defaultExtra = { headers: { test: "1" } };
      const client = new Client({
        url: "shared-base-url",
      });

      client.adapter.setDefaultExtra(defaultExtra);

      expect(client.adapter.defaultExtra).toStrictEqual(defaultExtra);
    });
    it("should assign new defaultMethod", async () => {
      const defaultMethod = "POST";
      const client = new Client({
        url: "shared-base-url",
      });

      client.adapter.setDefaultMethod(defaultMethod);

      expect(client.adapter.defaultMethod).toStrictEqual(defaultMethod);
    });
  });
});
