import { waitFor } from "@testing-library/dom";

import { ClientResponseType, getErrorMessage } from "client";
import { CommandResponseDetails } from "managers";
import { createDispatcher, createBuilder, createClient, createCommand, sleep } from "../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Dispatcher [ Events ]", () => {
  const clientSpy = jest.fn();

  let client = createClient({ callback: clientSpy });
  let builder = createBuilder().setClient(() => client);
  let command = createCommand(builder);
  let dispatcher = createDispatcher(builder);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    client = createClient({ callback: clientSpy });
    builder = createBuilder().setClient(() => client);
    command = createCommand(builder);
    dispatcher = createDispatcher(builder);
    createRequestInterceptor(command);
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using dispatcher events", () => {
    it("should emit loading event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onLoading(command.queueKey, spy);
      dispatcher.add(command);
      expect(spy).toBeCalledTimes(1);
      unmount();
      dispatcher.add(command);
      expect(spy).toBeCalledTimes(1);
    });
    it("should emit drained event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onDrained(command.queueKey, spy);
      dispatcher.add(command.setQueued(true));
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
      unmount();
      dispatcher.add(command.setQueued(true));
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
    it("should emit queue status change event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onQueueStatus(command.queueKey, spy);
      dispatcher.stop(command.queueKey);
      expect(spy).toBeCalledTimes(1);
      unmount();
      dispatcher.stop(command.queueKey);
      expect(spy).toBeCalledTimes(1);
    });
    it("should emit queue change event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onQueueChange(command.queueKey, spy);
      dispatcher.add(command);
      expect(spy).toBeCalledTimes(1);
      unmount();
      dispatcher.add(command);
      expect(spy).toBeCalledTimes(1);
    });
    it("should emit proper data response", async () => {
      let response: [ClientResponseType<unknown, unknown>, CommandResponseDetails];
      const mock = createRequestInterceptor(command);

      builder.commandManager.events.onResponse(command.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<CommandResponseDetails>).timestamp;
      });
      dispatcher.add(command);

      const clientResponse: ClientResponseType<unknown, unknown> = [mock, null, 200];
      const responseDetails: Omit<CommandResponseDetails, "timestamp"> = {
        retries: 0,
        isFailed: false,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([clientResponse, responseDetails]);
      });
    });
    it("should emit proper failed response", async () => {
      let response: [ClientResponseType<unknown, unknown>, CommandResponseDetails];
      const mock = createRequestInterceptor(command, { status: 400 });

      builder.commandManager.events.onResponse(command.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<CommandResponseDetails>).timestamp;
      });
      dispatcher.add(command);

      const clientResponse: ClientResponseType<unknown, unknown> = [null, mock, 400];
      const responseDetails: Omit<CommandResponseDetails, "timestamp"> = {
        retries: 0,
        isFailed: true,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([clientResponse, responseDetails]);
      });
    });
    it("should emit proper retry response", async () => {
      let response: [ClientResponseType<unknown, unknown>, CommandResponseDetails];
      const commandWithRetry = command.setRetry(1).setRetryTime(50);
      createRequestInterceptor(commandWithRetry, { status: 400, delay: 0 });

      builder.commandManager.events.onResponse(commandWithRetry.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<CommandResponseDetails>).timestamp;
      });
      dispatcher.add(commandWithRetry);

      await waitFor(() => {
        expect(response).toBeDefined();
      });

      const mock = createRequestInterceptor(commandWithRetry);

      const clientResponse: ClientResponseType<unknown, unknown> = [mock, null, 200];
      const responseDetails: Omit<CommandResponseDetails, "timestamp"> = {
        retries: 1,
        isFailed: false,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([clientResponse, responseDetails]);
      });
    });
    it("should emit proper cancel response", async () => {
      let response: [ClientResponseType<unknown, unknown>, CommandResponseDetails];
      createRequestInterceptor(command, { status: 400 });

      builder.commandManager.events.onResponse(command.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<CommandResponseDetails>).timestamp;
      });
      dispatcher.add(command);
      await sleep(1);
      builder.commandManager.abortAll();

      const clientResponse: ClientResponseType<unknown, unknown> = [null, getErrorMessage("abort"), 500];
      const responseDetails: Omit<CommandResponseDetails, "timestamp"> = {
        retries: 0,
        isFailed: true,
        isCanceled: true,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([clientResponse, responseDetails]);
      });
    });
  });
});
