import EventEmitter from "events";

import { getCommandManagerEvents } from "managers";
import { createBuilder, createCommand, sleep } from "../../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../../server";

describe("CommandManager [ Base ]", () => {
  const abortKey = "abort-key";
  const queueKey = "abort-key";
  const requestId = "some-id";
  let builder = createBuilder();
  let events = getCommandManagerEvents(new EventEmitter());

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    builder = createBuilder();
    events = getCommandManagerEvents(new EventEmitter());
  });

  afterAll(() => {
    stopServer();
  });

  describe("When app manager is initialized", () => {
    it("should allow to add abort controller", async () => {
      expect(builder.commandManager.getAbortController(abortKey, requestId)).toBeUndefined();
      builder.commandManager.addAbortController(abortKey, requestId);
      expect(builder.commandManager.getAbortController(abortKey, requestId)).toBeDefined();
    });
    it("should allow to remove abort controller", async () => {
      builder.commandManager.addAbortController(abortKey, requestId);
      builder.commandManager.removeAbortController(abortKey, requestId);
      expect(builder.commandManager.getAbortController(abortKey, requestId)).toBeUndefined();
    });
    it("should not throw when removing non-existing controller", async () => {
      expect(() => builder.commandManager.removeAbortController(abortKey, requestId)).not.toThrow();
    });
  });

  describe("When request is being aborted", () => {
    it("should remove it from dispatcher's queue storage", async () => {
      const spy = jest.fn();
      const command = createCommand(builder);
      createRequestInterceptor(command);
      builder.onResponse((response) => {
        spy();
        return response;
      });
      builder.fetchDispatcher.add(command);
      await sleep(5);
      builder.commandManager.abortAll();
      await sleep(1);
      const queue = builder.fetchDispatcher.getQueue(command.queueKey);
      expect(queue.requests).toHaveLength(0);
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe("When events get emitted", () => {
    it("should propagate the loading events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onLoading(queueKey, spy);
      events.onLoadingById(requestId, spyById);

      const values = {
        queueKey,
        requestId,
        isLoading: false,
        isRetry: false,
        isOffline: false,
      };

      events.emitLoading(queueKey, requestId, values);

      expect(spy).toBeCalledTimes(1);
      expect(spyById).toBeCalledTimes(1);
    });
    it("should propagate the request start events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onRequestStart(queueKey, spy);
      events.onRequestStartById(requestId, spyById);
      const command = createCommand(builder);

      const values = {
        requestId,
        command,
      };

      events.emitRequestStart(queueKey, requestId, values);

      expect(spy).toBeCalledTimes(1);
      expect(spyById).toBeCalledTimes(1);
    });
    it("should propagate the response start events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onResponseStart(queueKey, spy);
      events.onResponseStartById(requestId, spyById);
      const command = createCommand(builder);

      const values = {
        requestId,
        command,
      };

      events.emitResponseStart(queueKey, requestId, values);

      expect(spy).toBeCalledTimes(1);
      expect(spyById).toBeCalledTimes(1);
    });
    it("should propagate the upload events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onUploadProgress(queueKey, spy);
      events.onUploadProgressById(requestId, spyById);
      const command = createCommand(builder);

      const values = {
        progress: 0,
        timeLeft: 0,
        sizeLeft: 0,
        total: 0,
        loaded: 0,
        startTimestamp: 0,
      };

      const details = {
        requestId,
        command,
      };

      events.emitUploadProgress(queueKey, requestId, values, details);

      expect(spy).toBeCalledTimes(1);
      expect(spyById).toBeCalledTimes(1);
    });
    it("should propagate the download events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onDownloadProgress(queueKey, spy);
      events.onDownloadProgressById(requestId, spyById);
      const command = createCommand(builder);

      const values = {
        progress: 0,
        timeLeft: 0,
        sizeLeft: 0,
        total: 0,
        loaded: 0,
        startTimestamp: 0,
      };

      const details = {
        requestId,
        command,
      };

      events.emitDownloadProgress(queueKey, requestId, values, details);

      expect(spy).toBeCalledTimes(1);
      expect(spyById).toBeCalledTimes(1);
    });
  });
  it("should propagate the response events", async () => {
    const spy = jest.fn();
    const spyById = jest.fn();
    events.onResponse(queueKey, spy);
    events.onResponseById(requestId, spyById);

    const details = {
      retries: 0,
      timestamp: new Date(),
      isFailed: false,
      isCanceled: false,
      isOffline: false,
    };

    events.emitResponse(queueKey, requestId, [null, null, 200], details);

    expect(spy).toBeCalledTimes(1);
    expect(spyById).toBeCalledTimes(1);
  });
  it("should propagate the remove events", async () => {
    const spy = jest.fn();
    const spyById = jest.fn();
    events.onRemove(queueKey, spy);
    events.onRemoveById(requestId, spyById);
    const command = createCommand(builder);

    const values = {
      requestId,
      command,
    };

    events.emitRemove(queueKey, requestId, values);

    expect(spy).toBeCalledTimes(1);
    expect(spyById).toBeCalledTimes(1);
  });
});
