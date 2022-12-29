import { QueueDataType } from "dispatcher";
import { createDispatcher, createClient, createRequest } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("Dispatcher [ Basic ]", () => {
  let client = createClient();
  let request = createRequest(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient();
    request = createRequest(client);
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When lifecycle events get triggered", () => {
    it("should allow to change storage", async () => {
      const storage = new Map<string, QueueDataType>();
      const newDispatcher = createDispatcher(client, { storage });

      const dispatcherDump = newDispatcher.createStorageElement(request);
      newDispatcher.addQueueElement(request.queueKey, dispatcherDump);

      expect(storage.get(request.queueKey)?.requests[0]).toBe(dispatcherDump);
    });
    it("should trigger onInitialization callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(client, { onInitialization: spy });

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(newDispatcher);
    });
    it("should trigger onUpdateStorage callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(client, { onUpdateStorage: spy });

      newDispatcher.stop(request.queueKey);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(request.queueKey, { requests: [], stopped: true });
    });
    it("should trigger onDeleteFromStorage callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(client, { onDeleteFromStorage: spy });
      const dispatcherDump = newDispatcher.createStorageElement(request);

      newDispatcher.addQueueElement(request.queueKey, dispatcherDump);
      newDispatcher.delete(request.queueKey, dispatcherDump.requestId, request.abortKey);
      newDispatcher.addQueueElement(request.queueKey, dispatcherDump);
      newDispatcher.clearQueue(request.queueKey);

      expect(spy).toBeCalledTimes(2);
      expect(spy).toBeCalledWith(request.queueKey, { requests: [], stopped: false });
    });
    it("should trigger onClearStorage callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(client, { onClearStorage: spy });

      newDispatcher.clear();

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(newDispatcher);
    });
  });
});
