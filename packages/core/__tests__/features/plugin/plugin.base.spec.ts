import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Client } from "client";
import { Plugin } from "plugin";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Plugin [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-nase-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    jest.resetAllMocks();
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-nase-endpoint" });
  });

  afterAll(() => {
    stopServer();
  });

  describe("When initializing plugin", () => {
    it("should properly set initial values", () => {
      const pluginData = { test: true };
      const plugin = new Plugin({
        name: "test-plugin",
        data: pluginData,
      });

      expect(plugin.name).toBe("test-plugin");
      expect(plugin.data).toEqual(pluginData);
      expect(plugin.client).toBeUndefined();
    });

    it("should initialize with client", () => {
      const plugin = new Plugin({ name: "test-plugin" });
      const initializedPlugin = plugin.initialize(client);

      expect(initializedPlugin.client).toBe(client);
      expect(initializedPlugin).toBe(plugin);
    });
  });

  describe("When using plugin trigger", () => {
    it("should trigger registered method", () => {
      const callback = jest.fn();
      const plugin = new Plugin({ name: "test-plugin" });

      plugin.onDispatcherCleared(callback);
      plugin.trigger("onDispatcherCleared", {
        dispatcher: client.fetchDispatcher,
      });

      expect(callback).toHaveBeenCalledWith({ dispatcher: client.fetchDispatcher });
    });

    it("should not throw when triggering unregistered method", () => {
      const plugin = new Plugin({ name: "test-plugin" });

      expect(() => {
        plugin.trigger("onDispatcherCleared", {} as any);
      }).not.toThrow();
    });
  });

  describe("When using dispatcher effects", () => {
    it("should register dispatcher lifecycle methods", () => {
      const plugin = new Plugin({ name: "test-plugin" });
      const callback = jest.fn();

      const methods = [
        "onDispatcherCleared",
        "onDispatcherQueueDrained",
        "onDispatcherQueueRunning",
        "onDispatcherItemAdded",
        "onDispatcherItemDeleted",
        "onDispatcherQueueCreated",
        "onDispatcherQueueCleared",
      ];

      methods.forEach((method) => {
        const result = (plugin as any)[method](callback);
        expect(result).toBe(plugin);
        plugin.trigger(method as any, {});
        expect(callback).toHaveBeenCalledTimes(1);
        callback.mockClear();
      });
    });
  });

  describe("When using cache effects", () => {
    it("should register cache lifecycle methods", () => {
      const plugin = new Plugin({ name: "test-plugin" });
      const callback = jest.fn();

      const methods = ["onCacheItemChange", "onCacheItemDelete"];

      methods.forEach((method) => {
        const result = (plugin as any)[method](callback as any);
        expect(result).toBe(plugin);
        plugin.trigger(method as any, {});
        expect(callback).toHaveBeenCalledTimes(1);
        callback.mockClear();
      });
    });
  });

  describe("When using adapter effects", () => {
    it("should register adapter fetch method", () => {
      const plugin = new Plugin({ name: "test-plugin" });
      const callback = jest.fn();

      const result = plugin.onAdapterFetch(callback);
      expect(result).toBe(plugin);
      plugin.trigger("onAdapterFetch", {
        request: request as any,
        requestId: "123",
        adapter: client.adapter,
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("When using fetch effects", () => {
    it("should trigger success effects", async () => {
      mockRequest(request);
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();

      const effect = new Plugin({
        name: "123",
      })
        .onRequestError(spy1)
        .onRequestSuccess(spy2)
        .onRequestFinished(spy3)
        .onRequestStart(spy4)
        .onRequestTrigger(spy5);

      client.addPlugin(effect);

      request.send({});

      await waitFor(() => {
        expect(spy1).toHaveBeenCalledTimes(0);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).toHaveBeenCalledTimes(1);
        expect(spy4).toHaveBeenCalledTimes(1);
        expect(spy5).toHaveBeenCalledTimes(1);
      });
    });
    it("should trigger error effects", async () => {
      mockRequest(request, { status: 400 });
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();

      const effect = new Plugin({
        name: "123",
      })
        .onRequestError(spy1)
        .onRequestSuccess(spy2)
        .onRequestFinished(spy3)
        .onRequestStart(spy4)
        .onRequestTrigger(spy5);

      client.addPlugin(effect);

      request.send({});

      await waitFor(() => {
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(0);
        expect(spy3).toHaveBeenCalledTimes(1);
        expect(spy4).toHaveBeenCalledTimes(1);
        expect(spy5).toHaveBeenCalledTimes(1);
      });
    });
    it("should not throw when effects are empty", async () => {
      const effect = new Plugin({
        name: "123",
      });

      expect(effect.onRequestTrigger).not.toThrow();
      expect(effect.onRequestStart).not.toThrow();
      expect(effect.onRequestSuccess).not.toThrow();
      expect(effect.onRequestError).not.toThrow();
      expect(effect.onRequestFinished).not.toThrow();
    });
  });

  describe("When using mount/unmount lifecycle", () => {
    it("should register mount and unmount callbacks", () => {
      const plugin = new Plugin({ name: "test-plugin" });
      const mountCallback = jest.fn();
      const unmountCallback = jest.fn();

      const mountResult = plugin.onMount(mountCallback);
      const unmountResult = plugin.onUnmount(unmountCallback);

      expect(mountResult).toBe(plugin);
      expect(unmountResult).toBe(plugin);

      plugin.trigger("onMount", { client });
      plugin.trigger("onUnmount", { client });

      expect(mountCallback).toHaveBeenCalledWith({ client });
      expect(unmountCallback).toHaveBeenCalledWith({ client });
    });
  });

  describe("When using request lifecycle", () => {
    it("should register request create callback", () => {
      const plugin = new Plugin({ name: "test-plugin" });
      const callback = jest.fn();

      const result = plugin.onRequestCreate(callback);
      expect(result).toBe(plugin);

      plugin.trigger("onRequestCreate", {
        request,
      });

      expect(callback).toHaveBeenCalledWith({
        request,
      });
    });

    it("should register request trigger callback", () => {
      const plugin = new Plugin({ name: "test-plugin" });
      const callback = jest.fn();

      const result = plugin.onRequestTrigger(callback);
      expect(result).toBe(plugin);

      plugin.trigger("onRequestTrigger", {
        request,
      });

      expect(callback).toHaveBeenCalledWith({
        request,
      });
    });
  });
});
