import { RequestEffect } from "effect";
import { StringifyCallbackType } from "client";
import { RequestOptionsType, Request } from "request";
import { AdapterOptionsType, QueryStringifyOptionsType } from "adapter";
import { LoggerManager } from "managers";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createClient, createAdapter, createRequest, interceptorCallback, middlewareCallback } from "../../utils";

describe("Client [ Methods ]", () => {
  let client = createClient();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient();
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using config methods", () => {
    it("should assign default request config [setRequestDefaultOptions]", async () => {
      const options: Partial<RequestOptionsType<string, AdapterOptionsType>> = { method: "POST" };
      client.setRequestDefaultOptions(() => options);

      expect(client.requestDefaultOptions(createRequest(client).requestOptions)).toEqual(options);
    });
    it("should assign default adapter config [setAdapterDefaultOptions]", async () => {
      const options: AdapterOptionsType = { timeout: 12312312 };
      client.setAdapterDefaultOptions(() => options);

      expect(client.adapterDefaultOptions(createRequest(client))).toEqual(options);
    });
    it("should assign query params stringify config [setQueryParamsConfig]", async () => {
      const options: QueryStringifyOptionsType = { strict: false };
      client.setQueryParamsConfig(options);

      expect(client.queryParamsConfig).toEqual(options);
    });
    it("should assign debug value [setDebug]", async () => {
      client.setLogger((b) => new LoggerManager(b, { logger: () => null })).setDebug(true);
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
    it("should add single effect listeners on addEffect method trigger", async () => {
      const effect = new RequestEffect({ effectKey: "NEW-EFFECT" });

      client.addEffect(effect);

      expect(client.effects[0]).toBe(effect);
      expect(client.effects).toHaveLength(1);
    });
    it("should add effects array listeners on addEffect method trigger", async () => {
      const effect = new RequestEffect({ effectKey: "NEW-EFFECT" });

      client.addEffect([effect]);

      expect(client.effects[0]).toBe(effect);
      expect(client.effects).toHaveLength(1);
    });
    it("should remove effect listener on removeEffect method trigger", async () => {
      const effect = new RequestEffect({ effectKey: "NEW-EFFECT" });

      client.addEffect(effect);
      client.removeEffect(effect);
      expect(client.effects).toHaveLength(0);

      client.addEffect(effect);
      client.removeEffect(effect.getEffectKey());
      expect(client.effects).toHaveLength(0);
    });
    it("should not remove effect when wrong effectKey is passed", async () => {
      const effect = new RequestEffect({ effectKey: "NEW-EFFECT" });
      const otherEffect = new RequestEffect({ effectKey: "OTHER-EFFECT" });

      client.addEffect(effect);
      client.removeEffect(otherEffect);
      expect(client.effects).toHaveLength(1);

      client.removeEffect(otherEffect.getEffectKey());
      expect(client.effects).toHaveLength(1);
    });
    it("should assign query params handling callback [setHeaderMapper]", async () => {
      const callback = () => ({} as HeadersInit);
      client.setHeaderMapper(callback);

      expect(client.headerMapper).toEqual(callback);
    });
    it("should assign query params handling callback [setPayloadMapper]", async () => {
      const callback = () => "";
      client.setPayloadMapper(callback);

      expect(client.payloadMapper).toEqual(callback);
    });
  });
});
