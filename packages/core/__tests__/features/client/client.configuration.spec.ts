import type { ResponseType } from "adapter";
import { Cache } from "cache";
import { Client, createClient, resolveClientMode } from "client";
import type { ClientInstance } from "client";
import { Dispatcher } from "dispatcher";
import type { HttpAdapterType } from "http-adapter";
import { HttpAdapter } from "http-adapter";
import { AppManager, LoggerManager } from "managers";
import { Plugin } from "plugin";
import type { RequestInstance } from "request";
import type { ExtractErrorType, ExtractResponseType } from "types";

import { createCacheResponse, removeGlobal } from "../../utils/fixtures.utils";

type Data = { id: number };

describe("Client [ Configuration ]", () => {
  let client = new Client({ url: "shared-base-url" });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
  });

  afterEach(() => {
    client.clear();
    vi.unstubAllGlobals();
  });

  describe("When the client is created", () => {
    it("should create the client with the default modules", () => {
      const created = createClient({ url: "shared-base-url" });

      expect(created).toBeInstanceOf(Client);
      expect(created.url).toBe("shared-base-url");
      expect(created.cache).toBeInstanceOf(Cache);
      expect(created.fetchDispatcher).toBeInstanceOf(Dispatcher);
      expect(created.submitDispatcher).toBeInstanceOf(Dispatcher);
      expect(created.appManager).toBeInstanceOf(AppManager);
      expect(created.loggerManager).toBeInstanceOf(LoggerManager);
      expect(created.fetchDispatcher).not.toBe(created.submitDispatcher);
      expect(created.plugins).toStrictEqual([]);
      expect(created.isMockerEnabled).toBeTrue();
    });

    it("should keep the options it was created with", () => {
      const options = { url: "shared-base-url", mode: "server" as const };

      expect(new Client(options).options).toBe(options);
    });

    it.each([
      { option: "auto" as const, expected: "client" },
      { option: "client" as const, expected: "client" },
      { option: "server" as const, expected: "server" },
    ])("should resolve the $option mode to $expected in the browser", ({ option, expected }) => {
      expect(resolveClientMode(option)).toBe(expected);
      expect(new Client({ url: "shared-base-url", mode: option }).mode).toBe(expected);
    });

    it("should detect the mode in the browser when it is not set", () => {
      expect(new Client({ url: "shared-base-url" }).mode).toBe("client");
    });

    it("should resolve the automatic mode to the server one when there is no window", () => {
      removeGlobal("window");

      expect(new Client({ url: "shared-base-url" }).mode).toBe("server");
      expect(resolveClientMode("auto")).toBe("server");
      expect(resolveClientMode("client")).toBe("client");
    });

    it("should resolve the automatic mode to the server one when there is no document", () => {
      removeGlobal("document");

      expect(resolveClientMode("auto")).toBe("server");
    });

    it("should create the client without the window", () => {
      removeGlobal("window");

      const ssrClient = new Client({ url: "shared-base-url" });

      expect(ssrClient.mode).toBe("server");
      expect(ssrClient.appManager.isBrowser).toBeFalse();
      expect(ssrClient.appManager.isFocused).toBeTrue();
      expect(() => ssrClient.clear()).not.toThrow();
    });
  });

  describe("When the setters are used", () => {
    it("should return the client from every setter", () => {
      const interceptor = (request: RequestInstance) => request;
      const responseInterceptor = (response: ResponseType<any, any, HttpAdapterType>) => response;
      const plugin = new Plugin({ name: "plugin" });
      const mapper = () => "key";

      const results = [
        client.setDebug(true),
        client.setLogLevel("debug"),
        client.setLogger(() => new LoggerManager()),
        client.setEnableGlobalMocking(false),
        client.setUrl("other-url"),
        client.setAdapter(HttpAdapter()),
        client.onAuth(interceptor),
        client.onRequest(interceptor),
        client.onResponse(responseInterceptor),
        client.onSuccess(responseInterceptor),
        client.onError(responseInterceptor),
        client.removeOnAuthInterceptors([interceptor]),
        client.removeOnRequestInterceptors([interceptor]),
        client.removeOnResponseInterceptors([responseInterceptor]),
        client.removeOnSuccessInterceptors([responseInterceptor]),
        client.removeOnErrorInterceptors([responseInterceptor]),
        client.addPlugin(plugin),
        client.triggerPlugins("onMount", { client }),
        client.removePlugin(plugin),
        client.setAbortKeyMapper(mapper),
        client.setCacheKeyMapper(mapper),
        client.setQueryKeyMapper(mapper),
        client.setRequestIdMapper(mapper),
      ];

      results.forEach((result) => expect(result).toBe(client));
    });

    it("should apply the values of the setters", () => {
      client.setDebug(true).setLogLevel("info").setEnableGlobalMocking(false).setUrl("other-url");

      expect(client.debug).toBeTrue();
      expect(client.loggerManager.level).toBe("info");
      expect(client.isMockerEnabled).toBeFalse();
      expect(client.url).toBe("other-url");
    });

    it("should initialize the adapter it receives", () => {
      const adapter = HttpAdapter();

      client.setAdapter(adapter);

      expect(client.adapter).toBe(adapter);
      expect(adapter.client).toBe(client);
    });

    it("should use the key mappers for the created requests", () => {
      client
        .setCacheKeyMapper((request) => `cache:${request.endpoint}`)
        .setQueryKeyMapper((request) => `query:${request.endpoint}`)
        .setAbortKeyMapper((request) => `abort:${request.endpoint}`);

      const request = client.createRequest()({ endpoint: "/users" });

      expect(request.cacheKey).toBe("cache:/users");
      expect(request.queryKey).toBe("query:/users");
      expect(request.abortKey).toBe("abort:/users");
    });

    it("should prefer the keys set on the request over the key mappers", () => {
      client.setCacheKeyMapper(() => "mapped");

      const request = client.createRequest()({ endpoint: "/users", cacheKey: "custom" });

      expect(request.cacheKey).toBe("custom");
    });

    it("should use the request id mapper for the sent requests", async () => {
      const onBeforeSent = vi.fn();
      const request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });
      request.setMock(() => ({ data: { id: 1 }, status: 200 }));
      client.setRequestIdMapper(() => "custom-request-id");

      await request.send({ onBeforeSent });

      expect(onBeforeSent.mock.calls[0][0].requestId).toBe("custom-request-id");
    });
  });

  describe("When the logger is replaced", () => {
    it("should send the logs of the client to the new logger", () => {
      const logger = vi.fn();

      client.setDebug(true).setLogger(() => new LoggerManager({ logger }));
      client.logger.error({ title: "Client log", type: "system", extra: {} });

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger.mock.calls[0][0]).toStrictEqual(
        expect.objectContaining({ title: "Client log", module: "Client", level: "error" }),
      );
    });

    it("should send the logs of the modules created earlier to the new logger", () => {
      const logger = vi.fn();
      const request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });

      client.setDebug(true).setLogger(() => new LoggerManager({ logger, level: "debug" }));
      client.cache.set(request, createCacheResponse({ id: 1 }));

      const modules = new Set(logger.mock.calls.map(([log]) => log.module));
      expect(modules.has("Cache")).toBeTrue();
    });

    it("should pass the client to the logger factory and keep the returned manager", () => {
      const manager = new LoggerManager();
      const factory = vi.fn((_: ClientInstance) => manager);

      client.setLogger(factory);

      expect(factory).toHaveBeenCalledWith(client);
      expect(client.loggerManager).toBe(manager);
    });

    it("should stop using the previous logger", () => {
      const previous = vi.fn();
      const current = vi.fn();
      client.setDebug(true).setLogger(() => new LoggerManager({ logger: previous }));

      client.setLogger(() => new LoggerManager({ logger: current }));
      client.logger.error({ title: "Client log", type: "system", extra: {} });

      expect(previous).not.toHaveBeenCalled();
      expect(current).toHaveBeenCalledTimes(1);
    });

    it("should change the level of the current logger", () => {
      const logger = vi.fn();
      client.setDebug(true).setLogger(() => new LoggerManager({ logger }));

      client.logger.debug({ title: "Hidden", type: "system", extra: {} });
      client.setLogLevel("debug");
      client.logger.debug({ title: "Visible", type: "system", extra: {} });

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger.mock.calls[0][0].title).toBe("Visible");
    });

    it("should not log anything without the debug mode", () => {
      const logger = vi.fn();
      const request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });

      client.setLogger(() => new LoggerManager({ logger, level: "debug" }));
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.logger.error({ title: "Client log", type: "system", extra: {} });

      expect(logger).not.toHaveBeenCalled();
    });
  });

  describe("When many clients are used", () => {
    let other = new Client({ url: "other-base-url" });

    beforeEach(() => {
      other = new Client({ url: "other-base-url" });
    });

    afterEach(() => {
      other.clear();
    });

    it("should give every client its own modules", () => {
      expect(client.cache).not.toBe(other.cache);
      expect(client.cache.storage).not.toBe(other.cache.storage);
      expect(client.cache.emitter).not.toBe(other.cache.emitter);
      expect(client.fetchDispatcher).not.toBe(other.fetchDispatcher);
      expect(client.submitDispatcher).not.toBe(other.submitDispatcher);
      expect(client.appManager).not.toBe(other.appManager);
      expect(client.requestManager).not.toBe(other.requestManager);
      expect(client.loggerManager).not.toBe(other.loggerManager);
      expect(client.adapter).not.toBe(other.adapter);
      expect(client.plugins).not.toBe(other.plugins);
    });

    it("should not share the settings", () => {
      client.setDebug(true).setLogLevel("debug").setEnableGlobalMocking(false).setUrl("changed-url");

      expect(other.debug).toBeFalsy();
      expect(other.loggerManager.level).toBe("warning");
      expect(other.isMockerEnabled).toBeTrue();
      expect(other.url).toBe("other-base-url");
    });

    it("should not share the interceptors and plugins", () => {
      const interceptor = (request: RequestInstance) => request;
      const responseInterceptor = (response: ResponseType<any, any, HttpAdapterType>) => response;
      client
        .onAuth(interceptor)
        .onRequest(interceptor)
        .onResponse(responseInterceptor)
        .onSuccess(responseInterceptor)
        .onError(responseInterceptor)
        .addPlugin(new Plugin({ name: "plugin" }));

      expect(other.unstable_onAuthCallbacks).toHaveLength(0);
      expect(other.unstable_onRequestCallbacks).toHaveLength(0);
      expect(other.unstable_onResponseCallbacks).toHaveLength(0);
      expect(other.unstable_onSuccessCallbacks).toHaveLength(0);
      expect(other.unstable_onErrorCallbacks).toHaveLength(0);
      expect(other.plugins).toHaveLength(0);
    });

    it("should not share the key mappers", () => {
      client.setCacheKeyMapper(() => "mapped");

      expect(client.createRequest()({ endpoint: "/users" }).cacheKey).toBe("mapped");
      expect(other.createRequest()({ endpoint: "/users" }).cacheKey).not.toBe("mapped");
    });

    it("should not share the request defaults of the adapters", () => {
      client.adapter.setRequestDefaults(() => ({ retry: 5 }));

      expect(client.createRequest()({ endpoint: "/users" }).retry).toBe(5);
      expect(other.createRequest()({ endpoint: "/users" }).retry).toBe(0);
    });

    it("should not share the cached data", () => {
      const spy = vi.fn();
      const request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });
      const otherRequest = other.createRequest<{ response: Data }>()({ endpoint: "/users" });
      other.cache.events.onData(spy);

      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(request.cacheKey).toBe(otherRequest.cacheKey);
      expect(request.read()?.data).toStrictEqual({ id: 1 });
      expect(otherRequest.read()).toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });

    it("should not share the application state", () => {
      const spy = vi.fn();
      other.appManager.events.onOffline(spy);
      other.appManager.events.onBlur(spy);

      client.appManager.setOnline(false);
      client.appManager.setFocused(false);

      expect(other.appManager.isOnline).toBeTrue();
      expect(other.appManager.isFocused).toBeTrue();
      expect(spy).not.toHaveBeenCalled();
    });

    it("should not trigger the plugins of another client", async () => {
      const spy = vi.fn();
      const request = other.createRequest<{ response: Data }>()({ endpoint: "/users" });
      request.setMock(() => ({ data: { id: 1 }, status: 200 }));
      client.addPlugin(
        new Plugin({ name: "plugin" })
          .onRequestCreate(spy)
          .onRequestStart(spy)
          .onRequestSuccess(spy)
          .onCacheItemChange(spy),
      );

      await request.send();

      expect(spy).not.toHaveBeenCalled();
    });

    it("should clear only the given client", () => {
      const request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });
      const otherRequest = other.createRequest<{ response: Data }>()({ endpoint: "/users" });
      client.cache.set(request, createCacheResponse({ id: 1 }));
      other.cache.set(otherRequest, createCacheResponse({ id: 2 }));

      client.clear();

      expect(request.read()).toBeUndefined();
      expect(otherRequest.read()?.data).toStrictEqual({ id: 2 });
    });
  });

  describe("When the types are checked", () => {
    it("should keep the client type in the chained setters", () => {
      const typedClient = createClient<{ error: { message: string } }>({ url: "shared-base-url" });

      expectTypeOf(typedClient.setDebug(true)).toEqualTypeOf(typedClient);
      expectTypeOf(typedClient.setUrl("url")).toEqualTypeOf(typedClient);
      expectTypeOf(typedClient.onRequest((request) => request)).toEqualTypeOf(typedClient);
      expectTypeOf(typedClient.onResponse((response) => response)).toEqualTypeOf(typedClient);
      expectTypeOf(typedClient.addPlugin(new Plugin({ name: "plugin" }))).toEqualTypeOf(typedClient);
    });

    it("should use the global error type for the requests", () => {
      const typedClient = createClient<{ error: { message: string } }>({ url: "shared-base-url" });
      const request = typedClient.createRequest<{ response: Data }>()({ endpoint: "/users" });
      const withLocalError = typedClient.createRequest<{ response: Data; error: { code: number } }>()({
        endpoint: "/users",
      });

      expectTypeOf<ExtractResponseType<typeof request>>().toEqualTypeOf<Data>();
      expectTypeOf<ExtractErrorType<typeof request>>().toEqualTypeOf<{ message: string }>();
      expectTypeOf<ExtractErrorType<typeof withLocalError>>().toEqualTypeOf<{ code: number } | { message: string }>();
    });

    it("should use the Error type by default", () => {
      const request = createClient({ url: "shared-base-url" }).createRequest<{ response: Data }>()({
        endpoint: "/users",
      });

      expectTypeOf<ExtractErrorType<typeof request>>().toEqualTypeOf<Error>();
    });

    it("should type the interceptors and the mode", () => {
      expectTypeOf(client.mode).toEqualTypeOf<"client" | "server">();
      expectTypeOf(client.onRequest).parameter(0).toBeFunction();
      expectTypeOf(client.unstable_modifyRequest).returns.resolves.toEqualTypeOf<RequestInstance>();
      expectTypeOf(client.cache).toEqualTypeOf<Cache<HttpAdapterType>>();
    });

    it("should reject the wrong options", () => {
      // @ts-expect-error url is required
      expectTypeOf(createClient).toBeCallableWith({});
      // @ts-expect-error mode accepts only the known values
      expectTypeOf(createClient).toBeCallableWith({ url: "url", mode: "browser" });
      expectTypeOf(createClient).toBeCallableWith({ url: "url", mode: "auto" });
    });
  });
});
