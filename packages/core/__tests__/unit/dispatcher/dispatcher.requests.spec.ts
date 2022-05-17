import { createDispatcher, createBuilder, createCommand, createClient, sleep } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createRequestInterceptor } from "../../server/server";

describe("Dispatcher [ Requests ]", () => {
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

  describe("When request gets triggered", () => {
    it("should allow to add request to running requests", async () => {
      const requestId = "test";
      const command = createCommand(builder);
      expect(dispatcher.hasRunningRequest(command.queueKey, requestId)).toBeFalse();
      dispatcher.addRunningRequest(command.queueKey, requestId, command);
      expect(dispatcher.hasRunningRequest(command.queueKey, requestId)).toBeTrue();
    });
    it("should allow to stop request", async () => {
      const command = createCommand(builder);
      createRequestInterceptor(command, { delay: 0 });

      const requestId = dispatcher.add(command);
      expect(dispatcher.getRunningRequest(command.queueKey, requestId)).toBeDefined();

      dispatcher.stopRequest(command.queueKey, requestId);
      const queue = dispatcher.getQueue(command.queueKey);

      expect(dispatcher.getRunningRequest(command.queueKey, requestId)).not.toBeDefined();
      expect(queue.requests[0].stopped).toBeTrue();

      await sleep(30);

      const cacheValue = await builder.cache.get(command.cacheKey);
      expect(cacheValue).toBeDefined();
      expect(cacheValue?.details?.isCanceled).toBeTrue();
    });
    it("should allow to start previously stopped request", async () => {
      const command = createCommand(builder);
      createRequestInterceptor(command, { delay: 5 });

      const spy = jest.spyOn(builder.cache, "set");

      const requestId = dispatcher.add(command);
      dispatcher.stopRequest(command.queueKey, requestId);

      await sleep(50);
      dispatcher.startRequest(command.queueKey, requestId);
      await sleep(50);

      const cacheValue = await builder.cache.get(command.cacheKey);
      expect(spy).toBeCalledTimes(2);
      expect(cacheValue).toBeDefined();
      expect(cacheValue?.details?.isCanceled).toBeFalse();
    });
    it("should get all running requests", async () => {
      const firstCommand = createCommand(builder, { queueKey: "test1" });
      const secondCommand = createCommand(builder, { queueKey: "test2" });
      createRequestInterceptor(firstCommand, { delay: 5 });
      createRequestInterceptor(secondCommand, { delay: 5 });

      const firstRequestId = dispatcher.add(firstCommand);
      const secondRequestId = dispatcher.add(secondCommand);
      const runningRequests = dispatcher.getAllRunningRequest();

      expect(runningRequests).toHaveLength(2);
      expect(runningRequests).toPartiallyContain({ requestId: firstRequestId });
      expect(runningRequests).toPartiallyContain({ requestId: secondRequestId });
    });
    it("should get queueKey running requests", async () => {
      const firstCommand = createCommand(builder, { queueKey: "test1" });
      const secondCommand = createCommand(builder, { queueKey: "test2" });
      createRequestInterceptor(firstCommand, { delay: 5 });
      createRequestInterceptor(secondCommand, { delay: 5 });

      const firstRequestId = dispatcher.add(firstCommand);
      const secondRequestId = dispatcher.add(secondCommand);
      const runningRequests = dispatcher.getRunningRequests(firstCommand.queueKey);

      expect(runningRequests).toHaveLength(1);
      expect(runningRequests).toPartiallyContain({ requestId: firstRequestId });
      expect(runningRequests).not.toPartiallyContain({ requestId: secondRequestId });
    });
    it("should get single running request", async () => {
      const firstCommand = createCommand(builder, { queueKey: "test1" });
      const secondCommand = createCommand(builder, { queueKey: "test2" });
      createRequestInterceptor(firstCommand, { delay: 5 });
      createRequestInterceptor(secondCommand, { delay: 5 });

      dispatcher.add(secondCommand);
      const firstRequestId = dispatcher.add(firstCommand);
      const request = dispatcher.getRunningRequest(firstCommand.queueKey, firstRequestId);

      expect(request?.requestId).toBe(firstRequestId);
    });
    it("should allow to cancel all running requests", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const thirdSpy = jest.fn();
      const firstCommand = createCommand(builder);
      const secondCommand = createCommand(builder);
      createRequestInterceptor(firstCommand, { delay: 5 });
      createRequestInterceptor(secondCommand, { delay: 5 });

      const firstRequestId = dispatcher.add(firstCommand);
      const secondRequestId = dispatcher.add(secondCommand);

      await sleep(1);

      builder.commandManager.events.onAbortById(firstRequestId, firstSpy);
      builder.commandManager.events.onAbortById(secondRequestId, secondSpy);
      builder.commandManager.events.onAbort(firstCommand.queueKey, thirdSpy);

      dispatcher.cancelRunningRequests(firstCommand.queueKey);

      expect(dispatcher.getRunningRequests(firstCommand.queueKey)).toHaveLength(0);
      expect(firstSpy).toBeCalledTimes(1);
      expect(secondSpy).toBeCalledTimes(1);
      expect(thirdSpy).toBeCalledTimes(2);
    });
    it("should allow to cancel all single running requests", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const firstCommand = createCommand(builder);
      const secondCommand = createCommand(builder);
      createRequestInterceptor(firstCommand, { delay: 5 });
      createRequestInterceptor(secondCommand, { delay: 5 });

      dispatcher.add(secondCommand);
      const requestId = dispatcher.add(firstCommand);

      await sleep(1);

      builder.commandManager.events.onAbortById(requestId, firstSpy);
      builder.commandManager.events.onAbort(firstCommand.queueKey, secondSpy);
      dispatcher.cancelRunningRequest(firstCommand.queueKey, requestId);

      expect(dispatcher.getRunningRequests(firstCommand.queueKey)).toHaveLength(1);
      expect(firstSpy).toBeCalledTimes(1);
      expect(secondSpy).toBeCalledTimes(1);
    });
    it("should allow to delete running requests", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const thirdSpy = jest.fn();
      const firstCommand = createCommand(builder);
      const secondCommand = createCommand(builder);
      createRequestInterceptor(firstCommand, { delay: 5 });
      createRequestInterceptor(secondCommand, { delay: 5 });

      const firstRequestId = dispatcher.add(firstCommand);
      const secondRequestId = dispatcher.add(secondCommand);

      await sleep(1);

      builder.commandManager.events.onAbortById(firstRequestId, firstSpy);
      builder.commandManager.events.onAbortById(secondRequestId, secondSpy);
      builder.commandManager.events.onAbort(firstCommand.queueKey, thirdSpy);

      dispatcher.deleteRunningRequests(firstCommand.queueKey);

      expect(dispatcher.getRunningRequests(firstCommand.queueKey)).toHaveLength(0);
      expect(firstSpy).toBeCalledTimes(0);
      expect(secondSpy).toBeCalledTimes(0);
      expect(thirdSpy).toBeCalledTimes(0);
    });
    it("should allow to delete running request", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const thirdSpy = jest.fn();
      const firstCommand = createCommand(builder);
      const secondCommand = createCommand(builder);
      createRequestInterceptor(firstCommand, { delay: 5 });
      createRequestInterceptor(secondCommand, { delay: 5 });

      const firstRequestId = dispatcher.add(firstCommand);
      const secondRequestId = dispatcher.add(secondCommand);

      await sleep(1);

      builder.commandManager.events.onAbortById(firstRequestId, firstSpy);
      builder.commandManager.events.onAbortById(secondRequestId, secondSpy);
      builder.commandManager.events.onAbort(firstCommand.queueKey, thirdSpy);

      dispatcher.deleteRunningRequest(firstCommand.queueKey, firstRequestId);

      expect(dispatcher.getRunningRequests(firstCommand.queueKey)).toHaveLength(1);
      expect(firstSpy).toBeCalledTimes(0);
      expect(secondSpy).toBeCalledTimes(0);
      expect(thirdSpy).toBeCalledTimes(0);
    });
  });
});
