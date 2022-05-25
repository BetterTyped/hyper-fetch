import { waitFor } from "@testing-library/dom";

import { createDispatcher, createBuilder, createCommand, createClient, sleep } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createRequestInterceptor } from "../../server/server";

describe("Dispatcher [ Queue ]", () => {
  const clientSpy = jest.fn();

  let client = createClient({ callback: clientSpy });
  let builder = createBuilder().setClient(() => client);
  let dispatcher = createDispatcher(builder);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient({ callback: clientSpy });
    builder = createBuilder().setClient(() => client);
    dispatcher = createDispatcher(builder);
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using dispatcher add method", () => {
    it("should add request to the dispatcher storage and trigger it", async () => {
      const command = createCommand(builder);
      createRequestInterceptor(command);

      const loadingSpy = jest.fn();
      dispatcher.events.onLoading(command.queueKey, loadingSpy);
      const requestId = dispatcher.add(command);

      expect(requestId).toBeString();
      expect(clientSpy).toBeCalledTimes(1);
      expect(loadingSpy).toBeCalledTimes(1);
      expect(dispatcher.getIsActiveQueue(command.queueKey)).toBeTrue();
      expect(dispatcher.getQueueRequestCount(command.queueKey)).toBe(1);
    });
    it("should add running request and delete it once data is fetched", async () => {
      const command = createCommand(builder);
      createRequestInterceptor(command, { delay: 1 });

      dispatcher.add(command);

      expect(dispatcher.getAllRunningRequest()).toHaveLength(1);
      await waitFor(() => {
        expect(dispatcher.getAllRunningRequest()).toHaveLength(0);
        expect(dispatcher.getQueue(command.queueKey).requests).toHaveLength(0);
      });
    });
    it("should deduplicate requests and return ongoing requestId", async () => {
      const command = createCommand(builder, { deduplicate: true });
      createRequestInterceptor(command);

      const spy = jest.spyOn(dispatcher, "performRequest");

      const requestId = dispatcher.add(command);
      const deduplicatedId = dispatcher.add(command);

      expect(requestId).toBe(deduplicatedId);
      expect(spy).toBeCalledTimes(1);
      expect(dispatcher.getAllRunningRequest()).toHaveLength(1);
    });
    it("should queue the queued request", async () => {
      const command = createCommand(builder, { queued: true });
      createRequestInterceptor(command);

      const spy = jest.spyOn(dispatcher, "flushQueue");

      dispatcher.add(command);
      dispatcher.add(command);

      expect(spy).toBeCalledTimes(2);
      expect(dispatcher.getAllRunningRequest()).toHaveLength(1);
    });
    it("should send all concurrent request", async () => {
      const command = createCommand(builder, { queued: false });
      createRequestInterceptor(command);

      const spy = jest.spyOn(dispatcher, "performRequest");

      dispatcher.add(command);
      dispatcher.add(command);

      expect(spy).toBeCalledTimes(2);
      expect(dispatcher.getAllRunningRequest()).toHaveLength(2);
    });
    it("should send one request in cancel mode", async () => {
      const command = createCommand(builder, { cancelable: true });
      createRequestInterceptor(command);

      const spy = jest.spyOn(dispatcher, "performRequest");

      dispatcher.add(command);
      dispatcher.add(command);

      expect(spy).toBeCalledTimes(2);
      expect(dispatcher.getAllRunningRequest()).toHaveLength(1);
      expect(dispatcher.getQueue(command.queueKey).requests).toHaveLength(1);
    });
  });
  describe("When using dispatcher performRequest method", () => {
    it("should trigger fetch client", async () => {
      const command = createCommand(builder);
      createRequestInterceptor(command);

      const spy = jest.spyOn(builder, "client");
      const storageElement = dispatcher.createStorageElement(command);
      dispatcher.performRequest(storageElement);

      expect(spy).toBeCalledTimes(1);
    });
    it("should not trigger fetch client when app is offline", async () => {
      const command = createCommand(builder);
      createRequestInterceptor(command);

      builder.appManager.setOnline(false);
      const spy = jest.spyOn(builder, "client");
      const storageElement = dispatcher.createStorageElement(command);
      await dispatcher.performRequest(storageElement);

      expect(spy).toBeCalledTimes(0);
    });
    it("should trigger all requests when going back from offline", async () => {
      const command = createCommand(builder);
      createRequestInterceptor(command);

      const spy = jest.spyOn(builder, "client");
      builder.appManager.setOnline(false);
      dispatcher.add(command.setQueueKey("test1"));
      dispatcher.add(command.setQueueKey("test2"));
      dispatcher.add(command.setQueueKey("test3"));

      await sleep(5);

      expect(spy).toBeCalledTimes(0);
      builder.appManager.setOnline(true);

      await sleep(5);

      expect(spy).toBeCalledTimes(3);
    });
    it("should not trigger one storage element two times at the same time", async () => {
      const command = createCommand(builder);
      createRequestInterceptor(command);

      const spy = jest.spyOn(builder, "client");
      const storageElement = dispatcher.createStorageElement(command);
      dispatcher.performRequest(storageElement);
      dispatcher.performRequest(storageElement);

      expect(spy).toBeCalledTimes(1);
    });
  });
  describe("When retrying requests", () => {
    it("should retry failed request", async () => {
      const command = createCommand(builder, { retry: 1, retryTime: 0 });
      createRequestInterceptor(command, { status: 400, delay: 0 });

      const spy = jest.spyOn(builder, "client");
      dispatcher.add(command);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(2);
      });
    });
    it("should retry multiple times", async () => {
      const command = createCommand(builder, { retry: 2, retryTime: 0 });
      createRequestInterceptor(command, { status: 400, delay: 0 });

      const spy = jest.spyOn(builder, "client");
      dispatcher.add(command);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(3);
      });
    });
    it("should not retry failed request when command 'retry' option is disabled", async () => {
      const command = createCommand(builder, { retry: false });
      createRequestInterceptor(command, { status: 400, delay: 0 });

      const spy = jest.spyOn(builder, "client");
      dispatcher.add(command);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
    it("should not retry failed request in offline mode", async () => {
      const command = createCommand(builder, { retry: false });
      createRequestInterceptor(command, { status: 400, delay: 5 });

      const spy = jest.spyOn(builder, "client");
      dispatcher.add(command);
      await sleep(5);
      builder.appManager.setOnline(false);
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
  });
  describe("When flushing requests", () => {
    it("should flush all queues request", async () => {
      const firstCommand = createCommand(builder, { queueKey: "1" });
      const secondCommand = createCommand(builder, { queueKey: "2" });
      createRequestInterceptor(firstCommand);
      createRequestInterceptor(secondCommand);

      const spy = jest.spyOn(builder, "client");
      builder.appManager.setOnline(false);

      dispatcher.add(firstCommand);
      dispatcher.add(firstCommand);
      dispatcher.add(secondCommand);
      dispatcher.add(secondCommand);

      await sleep(5);
      expect(spy).toBeCalledTimes(0);
      builder.appManager.setOnline(true);
      dispatcher.flush();
      await waitFor(() => {
        expect(spy).toBeCalledTimes(4);
      });
    });
    it("should not trigger flush methods when queue is empty", async () => {
      const spy = jest.spyOn(dispatcher, "performRequest");
      dispatcher.flushQueue("fake-queue");
      expect(spy).not.toBeCalled();
    });
    it("should not trigger flushQueue when queue is processing", async () => {
      const command = createCommand(builder, { queued: true });
      createRequestInterceptor(command, { delay: 1 });

      const spy = jest.spyOn(dispatcher, "performRequest");
      dispatcher.add(command);
      dispatcher.add(command);

      dispatcher.flushQueue(command.queueKey);
      dispatcher.flushQueue(command.queueKey);
      dispatcher.flushQueue(command.queueKey);

      expect(spy).toBeCalledTimes(1);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(2);
      });
    });
    it("should not trigger flushQueue when having ongoing request", async () => {
      const command = createCommand(builder, { queued: true });
      createRequestInterceptor(command, { delay: 1 });

      const spy = jest.spyOn(dispatcher, "performRequest");
      const dump = dispatcher.createStorageElement(command);
      dispatcher.addQueueElement(command.queueKey, dump);
      dispatcher.addRunningRequest(command.queueKey, dump.requestId, command);

      dispatcher.flushQueue(command.queueKey);

      expect(spy).toBeCalledTimes(0);
    });
    it("should not duplicate ongoing requests using flushQueue", async () => {
      const command = createCommand(builder);
      createRequestInterceptor(command, { delay: 30 });

      const spy = jest.spyOn(dispatcher, "performRequest");
      dispatcher.add(command);
      dispatcher.add(command);

      await sleep(5);

      dispatcher.add(command);

      await sleep(5);

      expect(spy).toBeCalledTimes(3);
    });
  });
  describe("When starting and stoping queue", () => {
    it("should stop queue from being send", async () => {
      const command = createCommand(builder, { queueKey: "1" });
      createRequestInterceptor(command);

      const spy = jest.spyOn(builder, "client");
      dispatcher.stop(command.queueKey);
      dispatcher.add(command);
      dispatcher.add(command);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(0);
        expect(dispatcher.getIsActiveQueue(command.queueKey)).toBeFalse();
      });
    });
    it("should stop queue and cancel ongoing requests", async () => {
      const command = createCommand(builder, { queueKey: "1" });
      createRequestInterceptor(command);

      const spy = jest.spyOn(builder, "client");
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();

      const firstRequestId = dispatcher.add(command);
      const secondRequestId = dispatcher.add(command);
      builder.commandManager.events.onAbortById(firstRequestId, firstSpy);
      builder.commandManager.events.onAbortById(secondRequestId, secondSpy);

      await sleep(1);

      dispatcher.stop(command.queueKey);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(2);
        expect(firstSpy).toBeCalledTimes(1);
        expect(secondSpy).toBeCalledTimes(1);
        expect(dispatcher.getIsActiveQueue(command.queueKey)).toBeFalse();
      });
    });
    it("should start previously stopped queue", async () => {
      const command = createCommand(builder, { queueKey: "1" });
      createRequestInterceptor(command);

      const spy = jest.spyOn(builder, "client");
      dispatcher.stop(command.queueKey);
      dispatcher.add(command);
      dispatcher.add(command);
      dispatcher.start(command.queueKey);
      expect(dispatcher.getIsActiveQueue(command.queueKey)).toBeTrue();

      await waitFor(() => {
        expect(spy).toBeCalledTimes(2);
      });
    });
    it("should pause queue and finish ongoing requests", async () => {
      const command = createCommand(builder, { queueKey: "1" });
      createRequestInterceptor(command);

      const spy = jest.spyOn(builder, "client");
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();

      const firstRequestId = dispatcher.add(command);
      const secondRequestId = dispatcher.add(command);
      builder.commandManager.events.onAbortById(firstRequestId, firstSpy);
      builder.commandManager.events.onAbortById(secondRequestId, secondSpy);

      await sleep(1);

      dispatcher.pause(command.queueKey);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(2);
        expect(firstSpy).toBeCalledTimes(0);
        expect(secondSpy).toBeCalledTimes(0);
        expect(dispatcher.getIsActiveQueue(command.queueKey)).toBeFalse();
      });
    });
  });
});
