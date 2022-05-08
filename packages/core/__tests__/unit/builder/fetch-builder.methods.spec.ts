import { FetchEffect } from "effect";
import { StringifyCallbackType } from "builder";
import { FetchCommandConfig, FetchCommand } from "command";
import { XHRConfigType, QueryStringifyOptions } from "client";
import { LoggerManager, LoggerLevelType } from "managers";

import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, interceptorCallback, middlewareCallback } from "../../utils";

describe("FetchBuilder [ Methods ]", () => {
  let builder = createBuilder();

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    builder = createBuilder();
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using config methods", () => {
    it("should assign request config [setRequestConfig]", async () => {
      const options: XHRConfigType = { timeout: 1000 };
      builder.setRequestConfig(options);

      expect(builder.requestConfig).toEqual(options);
    });
    it("should assign default command config [setCommandConfig]", async () => {
      const options: Partial<FetchCommandConfig<string, XHRConfigType>> = { method: "POST" };
      builder.setCommandConfig(options);

      expect(builder.commandConfig).toEqual(options);
    });
    it("should assign query params stringify config [setQueryParamsConfig]", async () => {
      const options: QueryStringifyOptions = { strict: false };
      builder.setQueryParamsConfig(options);

      expect(builder.queryParamsConfig).toEqual(options);
    });
    it("should assign debug value [setDebug]", async () => {
      builder.setLogger((b) => new LoggerManager(b, { logger: () => null })).setDebug(true);
      expect(builder.debug).toEqual(true);
    });
    it("should assign query params handling callback [setStringifyQueryParams]", async () => {
      const callback: StringifyCallbackType = () => "";
      builder.setStringifyQueryParams(callback);

      expect(builder.stringifyQueryParams).toEqual(callback);
    });
    it("should assign logger levels [setLoggerLevel]", async () => {
      const options: LoggerLevelType[] = [];
      builder.setLoggerLevel(options);

      expect(builder.loggerManager.levels).toEqual(options);
    });
    it("should assign new client [setClient]", async () => {
      const callback = () => interceptorCallback()();
      builder.setClient(() => callback);

      expect(builder.client).toEqual(callback);
    });
    it("should assign auth middleware [onAuth]", async () => {
      const callback = middlewareCallback();
      builder.onAuth(callback).onAuth(callback);

      expect(builder.__onAuthCallbacks).toHaveLength(2);
      expect(builder.__onAuthCallbacks[0]).toEqual(callback);
      expect(builder.__onAuthCallbacks[1]).toEqual(callback);
    });
    it("should assign error interceptors [onError]", async () => {
      const callback = interceptorCallback();
      builder.onError(callback).onError(callback);

      expect(builder.__onErrorCallbacks).toHaveLength(2);
      expect(builder.__onErrorCallbacks[0]).toEqual(callback);
      expect(builder.__onErrorCallbacks[1]).toEqual(callback);
    });
    it("should assign success interceptors [onSuccess]", async () => {
      const callback = interceptorCallback();
      builder.onSuccess(callback).onSuccess(callback);

      expect(builder.__onSuccessCallbacks).toHaveLength(2);
      expect(builder.__onSuccessCallbacks[0]).toEqual(callback);
      expect(builder.__onSuccessCallbacks[1]).toEqual(callback);
    });
    it("should assign request triggers [onRequest]", async () => {
      const callback = middlewareCallback();
      builder.onRequest(callback).onRequest(callback);

      expect(builder.__onRequestCallbacks).toHaveLength(2);
      expect(builder.__onRequestCallbacks[0]).toEqual(callback);
      expect(builder.__onRequestCallbacks[1]).toEqual(callback);
    });
    it("should assign response triggers [onResponse]", async () => {
      const callback = interceptorCallback();
      builder.onResponse(callback).onResponse(callback);

      expect(builder.__onResponseCallbacks).toHaveLength(2);
      expect(builder.__onResponseCallbacks[0]).toEqual(callback);
      expect(builder.__onResponseCallbacks[1]).toEqual(callback);
    });
    it("should create new command on createCommand method trigger", async () => {
      const endpoint = "some-endpoint";
      const newCommand = builder.createCommand()({ endpoint });

      expect(newCommand instanceof FetchCommand).toBeTrue();
      expect(newCommand.endpoint).toBe(endpoint);
    });
    it("should add effects listeners on addEffects method trigger", async () => {
      const effect = new FetchEffect({ name: "NEW-EFFECT" });

      builder.addEffects([effect]);

      expect(builder.effects[0]).toBe(effect);
      expect(builder.effects).toHaveLength(1);
    });
    it("should remove effect listener on removeEffect method trigger", async () => {
      const effect = new FetchEffect({ name: "NEW-EFFECT" });

      builder.addEffects([effect]);
      builder.removeEffect(effect);

      expect(builder.effects).toHaveLength(0);
    });
  });
});
