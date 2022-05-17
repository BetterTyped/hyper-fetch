import { DispatcherData } from "dispatcher";
import { createDispatcher, createBuilder, createCommand } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("Dispatcher [ Basic ]", () => {
  const requestId = "test";

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
  });

  afterAll(() => {
    stopServer();
  });

  describe("When lifecycle events get triggered", () => {
    it("should allow to change storage", async () => {
      const storage = new Map<string, DispatcherData<unknown>>();
      const newDispatcher = createDispatcher(builder, { storage });

      const dispatcherDump = {
        requestId,
        commandDump: command.dump(),
        retries: 0,
        timestamp: +new Date(),
        stopped: false,
      };

      newDispatcher.addQueueElement(command.queueKey, dispatcherDump);

      expect(storage.get(command.queueKey)?.requests[0]).toBe(dispatcherDump);
    });
    it("should trigger onInitialization callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(builder, { onInitialization: spy });

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(newDispatcher);
    });
    it("should trigger onUpdateStorage callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(builder, { onUpdateStorage: spy });

      newDispatcher.stop(command.queueKey);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(command.queueKey, { requests: [], stopped: true });
    });
    it("should trigger onDeleteFromStorage callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(builder, { onDeleteFromStorage: spy });

      const dispatcherDump = {
        requestId,
        commandDump: command.dump(),
        retries: 0,
        timestamp: +new Date(),
        stopped: false,
      };

      newDispatcher.addQueueElement(command.queueKey, dispatcherDump);
      newDispatcher.delete(command.queueKey, requestId);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(command.queueKey, { requests: [], stopped: false });
    });
    it("should trigger onClearStorage callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(builder, { onClearStorage: spy });

      newDispatcher.clear();

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(newDispatcher);
    });
  });
});
