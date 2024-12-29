import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Plugin } from "plugin";
import { Client, StringifyCallbackType } from "client";
import { RequestOptionsType, Request } from "request";
import { AdapterOptionsType, QueryStringifyOptionsType } from "adapter";
import { LoggerManager } from "managers";
import { createAdapter, interceptorCallback, middlewareCallback } from "../../utils";

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
      const options: Partial<RequestOptionsType<string, AdapterOptionsType>> = { method: "POST" };
      client.setRequestDefaultOptions(() => options);
      const req = client.createRequest()({ endpoint: "test" });

      expect(client.requestDefaultOptions?.(request.requestOptions)).toEqual(options);
      expect(req.method).toBe("POST");
    });
    it("should assign default adapter config [setAdapterDefaultOptions]", async () => {
      const options: AdapterOptionsType = { timeout: 12312312 };
      client.setAdapterDefaultOptions(() => options);

      expect(client.adapterDefaultOptions?.(request)).toEqual(options);
    });
    it("should assign query params stringify config [setQueryParamsConfig]", async () => {
      const options: QueryStringifyOptionsType = {
        strict: false,
        dateParser: () => "date",
        objectParser: () => "object",
      };
      client.setQueryParamsConfig(options);

      expect(client.queryParamsConfig).toEqual(options);
      expect(client.stringifyQueryParams({ date: new Date() })).toBe("?date=date");
      expect(client.stringifyQueryParams({ object: {} })).toBe("?object=object");
    });
    it("should assign debug value [setDebug]", async () => {
      client.setLogger(() => new LoggerManager({ logger: () => null })).setDebug(true);
      expect(client.debug).toEqual(true);
    });
    it("should assign query params handling callback [setStringifyQueryParams]", async () => {
      const callback: StringifyCallbackType = () => "";
      client.setStringifyQueryParams(callback);

      expect(client.stringifyQueryParams).toEqual(callback);
    });
    it("should assign logger levels [setLoggerLevel]", async () => {
      client.setLoggerSeverity(1);

      expect(client.loggerManager.severity).toEqual(1);
    });
    it("should assign new adapter [setAdapter]", async () => {
      const callback = createAdapter();
      client.setAdapter(() => callback);

      expect(client.adapter).toEqual(callback);
    });
    it("should assign new adapter and return client [setAdapter]", async () => {
      const callback = createAdapter();
      client.setAdapter((instance) => instance.setAdapter(() => callback));

      expect(client.adapter).toEqual(callback);
    });
    it("should assign auth middleware [onAuth]", async () => {
      const callback = middlewareCallback();
      client.onAuth(callback).onAuth(callback);

      expect(client.__onAuthCallbacks).toHaveLength(2);
      expect(client.__onAuthCallbacks[0]).toEqual(callback);
      expect(client.__onAuthCallbacks[1]).toEqual(callback);
    });
    it("should assign error interceptors [onError]", async () => {
      const callback = interceptorCallback();
      client.onError(callback).onError(callback);

      expect(client.__onErrorCallbacks).toHaveLength(2);
      expect(client.__onErrorCallbacks[0]).toEqual(callback);
      expect(client.__onErrorCallbacks[1]).toEqual(callback);
    });
    it("should assign success interceptors [onSuccess]", async () => {
      const callback = interceptorCallback();
      client.onSuccess(callback).onSuccess(callback);

      expect(client.__onSuccessCallbacks).toHaveLength(2);
      expect(client.__onSuccessCallbacks[0]).toEqual(callback);
      expect(client.__onSuccessCallbacks[1]).toEqual(callback);
    });
    it("should assign request triggers [onRequest]", async () => {
      const callback = middlewareCallback();
      client.onRequest(callback).onRequest(callback);

      expect(client.__onRequestCallbacks).toHaveLength(2);
      expect(client.__onRequestCallbacks[0]).toEqual(callback);
      expect(client.__onRequestCallbacks[1]).toEqual(callback);
    });
    it("should assign response triggers [onResponse]", async () => {
      const callback = interceptorCallback();
      client.onResponse(callback).onResponse(callback);

      expect(client.__onResponseCallbacks).toHaveLength(2);
      expect(client.__onResponseCallbacks[0]).toEqual(callback);
      expect(client.__onResponseCallbacks[1]).toEqual(callback);
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
      const callback = () => ({}) as HeadersInit;
      client.setHeaderMapper(callback);

      expect(client.headerMapper).toEqual(callback);
    });
    it("should assign payload handling callback [setPayloadMapper]", async () => {
      const callback = () => "";
      client.setPayloadMapper(callback);

      expect(client.payloadMapper).toEqual(callback);
    });
    it("should assign endpoint handling callback [setEndpointMapper]", async () => {
      const callback = () => "";
      client.setEndpointMapper(callback);

      expect(client.endpointMapper).toEqual(callback);
    });
    it("should assign key mappers", async () => {
      const callback = () => "";
      client.setAbortKeyMapper(callback);
      client.setCacheKeyMapper(callback);
      client.setQueueKeyMapper(callback);
      client.setEffectKeyMapper(callback);

      expect(client.abortKeyMapper).toEqual(callback);
      expect(client.cacheKeyMapper).toEqual(callback);
      expect(client.queryKeyMapper).toEqual(callback);
      expect(client.effectKeyMapper).toEqual(callback);
    });
  });
});
