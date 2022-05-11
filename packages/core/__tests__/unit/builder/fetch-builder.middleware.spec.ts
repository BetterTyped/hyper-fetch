import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCommand, middlewareCallback } from "../../utils";
import { testCallbacksExecution } from "../../shared";

describe("FetchBuilder [ Middleware ]", () => {
  let builder = createBuilder();
  let command = createCommand(builder);

  const spy1 = jest.fn();
  const spy2 = jest.fn();
  const spy3 = jest.fn();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    builder = createBuilder();
    command = createCommand(builder);
    resetInterceptors();
    jest.clearAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When middleware callbacks being added", () => {
    it("should assign onAuth middleware", async () => {
      const callback = middlewareCallback();
      builder.onAuth(callback).onAuth(callback);

      expect(builder.__onAuthCallbacks).toHaveLength(2);
      expect(builder.__onAuthCallbacks[0]).toEqual(callback);
      expect(builder.__onAuthCallbacks[1]).toEqual(callback);
    });
    it("should assign onRequest middleware", async () => {
      const callback = middlewareCallback();
      builder.onRequest(callback).onRequest(callback);

      expect(builder.__onRequestCallbacks).toHaveLength(2);
      expect(builder.__onRequestCallbacks[0]).toEqual(callback);
      expect(builder.__onRequestCallbacks[1]).toEqual(callback);
    });
  });

  describe("When middleware callbacks go into the execution loop", () => {
    it("should trigger __modifyAuth async loop", async () => {
      const callbackFirst = middlewareCallback({ callback: spy1, sleepTime: 10 });
      const callbackMiddle = middlewareCallback({ callback: spy2 });
      const callbackLast = middlewareCallback({ callback: spy3, sleepTime: 10 });

      builder.onAuth(callbackFirst).onAuth(callbackMiddle).onAuth(callbackLast);
      await builder.__modifyAuth(command);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifyRequest async loop", async () => {
      const callbackFirst = middlewareCallback({ callback: spy1, sleepTime: 10 });
      const callbackMiddle = middlewareCallback({ callback: spy2 });
      const callbackLast = middlewareCallback({ callback: spy3, sleepTime: 10 });

      builder.onRequest(callbackFirst).onRequest(callbackMiddle).onRequest(callbackLast);
      await builder.__modifyRequest(command);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
  });

  describe("When middleware returns undefined value", () => {
    it("should throw onRequest method when command is not returned", async () => {
      builder.onRequest(() => undefined as any);

      expect(builder.__modifyRequest(command)).rejects.toThrow();
    });
    it("should throw onAuth method when command is not returned", async () => {
      builder.onAuth(() => undefined as any);

      expect(builder.__modifyAuth(command)).rejects.toThrow();
    });
  });
});
