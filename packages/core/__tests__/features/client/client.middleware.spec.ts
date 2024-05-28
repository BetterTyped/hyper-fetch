import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";
import { middlewareCallback } from "../../utils";
import { testCallbacksExecution } from "../../shared";
import { Client } from "client";

describe("Client [ Middleware ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-base-endpoint" });

  const spy1 = jest.fn();
  const spy2 = jest.fn();
  const spy3 = jest.fn();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-base-endpoint" });
    resetInterceptors();
    jest.clearAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When middleware callbacks being added", () => {
    it("should assign onAuth middleware", async () => {
      const callback = middlewareCallback();
      client.onAuth(callback).onAuth(callback);

      expect(client.__onAuthCallbacks).toHaveLength(2);
      expect(client.__onAuthCallbacks[0]).toEqual(callback);
      expect(client.__onAuthCallbacks[1]).toEqual(callback);
    });
    it("should assign onRequest middleware", async () => {
      const callback = middlewareCallback();
      client.onRequest(callback).onRequest(callback);

      expect(client.__onRequestCallbacks).toHaveLength(2);
      expect(client.__onRequestCallbacks[0]).toEqual(callback);
      expect(client.__onRequestCallbacks[1]).toEqual(callback);
    });
  });

  describe("When middleware callbacks go into the execution loop", () => {
    it("should trigger __modifyAuth async loop", async () => {
      const callbackFirst = middlewareCallback({ callback: spy1, sleepTime: 10 });
      const callbackMiddle = middlewareCallback({ callback: spy2 });
      const callbackLast = middlewareCallback({ callback: spy3, sleepTime: 10 });

      client.onAuth(callbackFirst).onAuth(callbackMiddle).onAuth(callbackLast);
      await client.__modifyAuth(request);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifyRequest async loop", async () => {
      const callbackFirst = middlewareCallback({ callback: spy1, sleepTime: 10 });
      const callbackMiddle = middlewareCallback({ callback: spy2 });
      const callbackLast = middlewareCallback({ callback: spy3, sleepTime: 10 });

      client.onRequest(callbackFirst).onRequest(callbackMiddle).onRequest(callbackLast);
      await client.__modifyRequest(request);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
  });

  describe("When middleware returns undefined value", () => {
    it("should throw onRequest method when request is not returned", async () => {
      client.onRequest(() => undefined as any);

      expect(client.__modifyRequest(request)).rejects.toThrow();
    });
    it("should throw onAuth method when request is not returned", async () => {
      client.onAuth(() => undefined as any);

      expect(client.__modifyAuth(request)).rejects.toThrow();
    });
  });

  describe("When user wants to remove listeners", () => {
    it("should allow for removing middleware on request", async () => {
      const firstCallback = middlewareCallback({ callback: spy1 });
      const secondCallback = middlewareCallback({ callback: spy2 });
      client.onRequest(firstCallback).onRequest(secondCallback);
      createRequestInterceptor(request);

      await request.send();
      client.removeOnRequestInterceptors([secondCallback]);

      await request.send();

      expect(spy1).toHaveBeenCalledTimes(2);
      expect(spy2).toHaveBeenCalledTimes(1);
    });
    it("should allow for removing interceptors on auth", async () => {
      const authRequest = client.createRequest()({ endpoint: "/auth" }).setAuth(true);
      const firstCallback = middlewareCallback({ callback: spy1 });
      const secondCallback = middlewareCallback({ callback: spy2 });
      client.onAuth(firstCallback).onAuth(secondCallback);
      createRequestInterceptor(authRequest);

      await authRequest.send();
      client.removeOnAuthInterceptors([secondCallback]);

      await authRequest.send();

      expect(spy1).toHaveBeenCalledTimes(2);
      expect(spy2).toHaveBeenCalledTimes(1);
    });
  });
});
