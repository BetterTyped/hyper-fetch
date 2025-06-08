import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Plugin } from "plugin";
import { Client } from "client";
import { RequestOptionsType, Request } from "request";
import { LoggerManager } from "managers";
import { createAdapter, interceptorCallback, middlewareCallback } from "../../utils";
import { HttpAdapterOptionsType, QueryStringifyOptionsType } from "http-adapter";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Client [ Methods ]", () => {
  let client = new Client({ url: "shared-base-url" });
  const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using config methods", () => {
    it("should assign default request config [setRequestDefaultOptions]", async () => {
      const options: Partial<RequestOptionsType<string, HttpAdapterOptionsType>> = { method: "POST" };
      client.adapter.setRequestDefaults(() => options);
      const req = client.createRequest()({ endpoint: "test" });

      expect(client.adapter.unstable_getRequestDefaults?.(request.requestOptions)).toEqual(options);
      expect(req.method).toBe("POST");
    });
    it("should assign default adapter config [setAdapterDefaultOptions]", async () => {
      const options: HttpAdapterOptionsType = { timeout: 12312312 };
      client.adapter.setAdapterDefaults(() => options);

      expect(client.adapter.unstable_getAdapterDefaults?.(request)).toEqual(options);
    });
    it("should assign query params stringify config [setQueryParamsConfig]", async () => {
      const options: QueryStringifyOptionsType = {
        strict: false,
        dateParser: () => "date",
        objectParser: () => "object",
      };
      client.adapter.setQueryParamsMapperConfig(options);

      expect(client.adapter.unstable_queryParamsMapperConfig).toEqual(options);
      expect(client.adapter.unstable_queryParamsMapper({ date: new Date() })).toBe("?date=date");
      expect(client.adapter.unstable_queryParamsMapper({ object: {} })).toBe("?object=object");
    });
    it("should assign debug value [setDebug]", async () => {
      client.setLogger(() => new LoggerManager({ logger: () => null })).setDebug(true);
      expect(client.debug).toEqual(true);
    });
    it("should assign query params handling callback [setStringifyQueryParams]", async () => {
      const callback = () => "?test=1";
      client.adapter.setQueryParamsMapper(callback);

      expect(client.adapter.unstable_queryParamsMapper({}, {})).toEqual("?test=1");
    });
    it("should assign logger levels [setLoggerLevel]", async () => {
      client.setLogLevel("info");

      expect(client.loggerManager.level).toEqual("info");
    });
    it("should assign new adapter [setAdapter]", async () => {
      const callback = createAdapter();
      client.setAdapter(callback);

      expect(client.adapter).toEqual(callback);
    });
    it("should assign auth middleware [onAuth]", async () => {
      const callback = middlewareCallback();
      client.onAuth(callback).onAuth(callback);

      expect(client.unstable_onAuthCallbacks).toHaveLength(2);
      expect(client.unstable_onAuthCallbacks[0]).toEqual(callback);
      expect(client.unstable_onAuthCallbacks[1]).toEqual(callback);
    });
    it("should assign error interceptors [onError]", async () => {
      const callback = interceptorCallback();
      client.onError(callback).onError(callback);

      expect(client.unstable_onErrorCallbacks).toHaveLength(2);
      expect(client.unstable_onErrorCallbacks[0]).toEqual(callback);
      expect(client.unstable_onErrorCallbacks[1]).toEqual(callback);
    });
    it("should assign success interceptors [onSuccess]", async () => {
      const callback = interceptorCallback();
      client.onSuccess(callback).onSuccess(callback);

      expect(client.unstable_onSuccessCallbacks).toHaveLength(2);
      expect(client.unstable_onSuccessCallbacks[0]).toEqual(callback);
      expect(client.unstable_onSuccessCallbacks[1]).toEqual(callback);
    });
    it("should assign request triggers [onRequest]", async () => {
      const callback = middlewareCallback();
      client.onRequest(callback).onRequest(callback);

      expect(client.unstable_onRequestCallbacks).toHaveLength(2);
      expect(client.unstable_onRequestCallbacks[0]).toEqual(callback);
      expect(client.unstable_onRequestCallbacks[1]).toEqual(callback);
    });
    it("should assign response triggers [onResponse]", async () => {
      const callback = interceptorCallback();
      client.onResponse(callback).onResponse(callback);

      expect(client.unstable_onResponseCallbacks).toHaveLength(2);
      expect(client.unstable_onResponseCallbacks[0]).toEqual(callback);
      expect(client.unstable_onResponseCallbacks[1]).toEqual(callback);
    });
    it("should create new request on createRequest method trigger", async () => {
      const endpoint = "some-endpoint";
      const newRequest = client.createRequest()({ endpoint });

      expect(newRequest instanceof Request).toBeTrue();
      expect(newRequest.endpoint).toBe(endpoint);
    });
    it("should add single effect listeners on addPlugin method trigger", async () => {
      const plugin = new Plugin({ name: "NEW-EFFECT" });

      client.addPlugin(plugin);

      expect(client.plugins[0]).toBe(plugin);
      expect(client.plugins).toHaveLength(1);
    });
    it("should add plugins array listeners on addPlugin method trigger", async () => {
      const plugin = new Plugin({ name: "NEW-EFFECT" });

      client.addPlugin(plugin);

      expect(client.plugins[0]).toBe(plugin);
      expect(client.plugins).toHaveLength(1);
    });
    it("should remove plugin listener on removePlugin method trigger", async () => {
      const plugin = new Plugin({ name: "NEW-EFFECT" });

      client.addPlugin(plugin);
      client.removePlugin(plugin);
      expect(client.plugins).toHaveLength(0);

      client.addPlugin(plugin);
      expect(client.plugins).toHaveLength(1);
    });
    it("should not remove plugin when wrong pluginKey is passed", async () => {
      const plugin = new Plugin({ name: "NEW-EFFECT" });
      const otherEffect = new Plugin({ name: "OTHER-EFFECT" });

      client.addPlugin(plugin);
      client.removePlugin(otherEffect);
      expect(client.plugins).toHaveLength(1);

      expect(client.plugins).toHaveLength(1);
    });
    it("should assign query params handling callback [setHeaderMapper]", async () => {
      const callback = () => ({ test: 123 }) as any as HeadersInit;
      client.adapter.setHeaderMapper(callback);

      expect(client.adapter.unstable_headerMapper({}, {})).toEqual({ test: 123 });
    });
    it("should assign payload handling callback [setPayloadMapper]", async () => {
      const callback = () => "test-123";
      client.adapter.setPayloadMapper(callback);

      expect(client.adapter.unstable_payloadMapper({}, {})).toEqual("test-123");
    });
    it("should assign endpoint handling callback [setEndpointMapper]", async () => {
      const callback = () => "test-endpoint";
      client.adapter.setEndpointMapper(callback);

      expect(client.adapter.unstable_endpointMapper({}, {})).toEqual("test-endpoint");
    });
    it("should assign key mappers", async () => {
      const callback = () => "";
      client.setAbortKeyMapper(callback);
      client.setCacheKeyMapper(callback);
      client.setQueryKeyMapper(callback);

      expect(client.unstable_abortKeyMapper).toEqual(callback);
      expect(client.unstable_cacheKeyMapper).toEqual(callback);
      expect(client.unstable_queryKeyMapper).toEqual(callback);
    });
  });
});
