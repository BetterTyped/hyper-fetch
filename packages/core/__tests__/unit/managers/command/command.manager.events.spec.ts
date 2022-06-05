import { waitFor } from "@testing-library/dom";
import { createBuilder, createCommand, sleep } from "../../../utils";
import { resetInterceptors, startServer, stopServer, createRequestInterceptor } from "../../../server";

describe("CommandManager [ Events ]", () => {
  let builder = createBuilder();
  let command = createCommand(builder);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    builder = createBuilder();
    command = createCommand(builder);
  });

  afterAll(() => {
    stopServer();
  });

  describe("When command manager events get triggered", () => {
    it("should trigger request lifecycle events", async () => {
      createRequestInterceptor(command);

      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();
      const spy6 = jest.fn();

      builder.commandManager.events.onRequestStart(command.queueKey, spy1);
      builder.commandManager.events.onResponseStart(command.queueKey, spy2);
      builder.commandManager.events.onUploadProgress(command.queueKey, spy3);
      builder.commandManager.events.onDownloadProgress(command.queueKey, spy4);
      builder.commandManager.events.onResponse(command.cacheKey, spy5);

      const requestId = builder.fetchDispatcher.add(command);

      builder.commandManager.events.onResponseById(requestId, spy6);

      await waitFor(() => {
        expect(spy1).toBeCalledTimes(1);
        expect(spy2).toBeCalledTimes(1);
        expect(spy3).toBeCalledTimes(2);
        expect(spy4).toBeCalledTimes(2);
        expect(spy5).toBeCalledTimes(1);
        expect(spy6).toBeCalledTimes(1);
      });
    });
  });
  describe("When command manager aborts the request", () => {
    it("should allow to abort request by id", async () => {
      createRequestInterceptor(command);
      const spy1 = jest.fn();
      const spy2 = jest.fn();

      const requestId = builder.fetchDispatcher.add(command);
      builder.commandManager.events.onAbort(command.abortKey, spy1);
      builder.commandManager.events.onAbortById(requestId, spy2);

      await sleep(5);

      builder.commandManager.abortByKey(command.abortKey);
      await waitFor(() => {
        expect(spy1).toBeCalledTimes(1);
        expect(spy2).toBeCalledTimes(1);
      });

      expect(builder.appManager.isFocused).toBeTrue();
    });
    it("should allow to abort all requests", async () => {
      createRequestInterceptor(command);
      const spy1 = jest.fn();
      const spy2 = jest.fn();

      const requestId = builder.fetchDispatcher.add(command);
      builder.commandManager.events.onAbort(command.abortKey, spy1);
      builder.commandManager.events.onAbortById(requestId, spy2);

      await sleep(5);

      builder.commandManager.abortAll();
      await waitFor(() => {
        expect(spy1).toBeCalledTimes(1);
        expect(spy2).toBeCalledTimes(1);
      });

      expect(builder.appManager.isFocused).toBeTrue();
    });
    it("should not throw when removing non-existing controller key", async () => {
      expect(() => builder.commandManager.abortByKey("fake-key")).not.toThrow();
    });
  });
});
