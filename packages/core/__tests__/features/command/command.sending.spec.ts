import { getErrorMessage } from "client";
import { createBuilder, createCommand, sleep } from "../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Command [ Sending ]", () => {
  const fixture = { test: 1, data: [1, 2, 3] };

  let builder = createBuilder();
  let command = createCommand(builder);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    builder = createBuilder();
    command = createCommand(builder);
    resetInterceptors();
    jest.resetAllMocks();
    createRequestInterceptor(command, { fixture, delay: 40 });
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using command's exec method", () => {
    it("should return client response", async () => {
      const request = command.exec();
      await sleep(5);
      expect(builder.fetchDispatcher.getAllRunningRequest()).toHaveLength(0);
      const response = await request;
      expect(response).toStrictEqual([fixture, null, 200]);
    });
  });
  describe("When using command's send method", () => {
    it("should return client response", async () => {
      const response = await command.send();

      expect(response).toStrictEqual([fixture, null, 200]);
    });
    it("should wait to resolve request in online mode", async () => {
      const spy = jest.fn();
      createRequestInterceptor(command, { delay: 10, status: 400 });
      const request = command.send();
      await sleep(5);
      builder.appManager.setOnline(false);

      const unmount = builder.commandManager.events.onResponse(command.cacheKey, () => {
        spy();
        createRequestInterceptor(command, { fixture, delay: 40 });
        builder.appManager.setOnline(true);
        unmount();
      });

      const response = await request;
      expect(response).toStrictEqual([fixture, null, 200]);
      expect(spy).toBeCalledTimes(1);
    });
    it("should wait to resolve request retries", async () => {
      const spy = jest.fn();
      createRequestInterceptor(command, { delay: 10, status: 400 });
      const request = command.setRetry(1).setRetryTime(30).send();
      await sleep(5);

      const unmount = builder.commandManager.events.onResponse(command.cacheKey, () => {
        spy();
        createRequestInterceptor(command, { fixture, delay: 40 });
        unmount();
      });

      const response = await request;
      expect(response).toStrictEqual([fixture, null, 200]);
      expect(spy).toBeCalledTimes(1);
    });
    it("should return error once request got removed", async () => {
      createRequestInterceptor(command, { delay: 10, status: 400 });
      const request = command.send();
      await sleep(5);

      const runningRequests = builder.fetchDispatcher.getAllRunningRequest();
      builder.fetchDispatcher.delete(command.queueKey, runningRequests[0].requestId, command.abortKey);

      const response = await request;
      expect(response).toStrictEqual([null, getErrorMessage(), 0]);
    });
    it("should allow to settle the request", async () => {
      const spy = jest.fn();
      const response = await command.send({}, spy);

      expect(response).toStrictEqual([fixture, null, 200]);
    });
  });
});
