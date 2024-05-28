import { QueueDataType } from "dispatcher";
import { createDispatcher } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { Client } from "client";

describe("Dispatcher [ Basic ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-nase-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-nase-endpoint" });
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When lifecycle events get triggered", () => {
    it("should allow to change storage", async () => {
      const storage = new Map<string, QueueDataType<any>>();
      const newDispatcher = createDispatcher(client, { storage });

      const dispatcherDump = newDispatcher.createStorageElement(request);
      newDispatcher.addQueueElement(request.queueKey, dispatcherDump);

      expect(storage.get(request.queueKey)?.requests[0]).toBe(dispatcherDump);
    });
    it("should trigger onInitialization callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(client, { onInitialization: spy });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(newDispatcher);
    });
    it("should trigger onUpdateStorage callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(client, { onUpdateStorage: spy });

      newDispatcher.stop(request.queueKey);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(request.queueKey, { requests: [], stopped: true });
    });
    it("should trigger onDeleteFromStorage callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(client, { onDeleteFromStorage: spy });
      const dispatcherDump = newDispatcher.createStorageElement(request);

      newDispatcher.addQueueElement(request.queueKey, dispatcherDump);
      newDispatcher.delete(request.queueKey, dispatcherDump.requestId, request.abortKey);
      newDispatcher.addQueueElement(request.queueKey, dispatcherDump);
      newDispatcher.clearQueue(request.queueKey);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(request.queueKey, { requests: [], stopped: false });
    });
    it("should trigger onClearStorage callback", async () => {
      const spy = jest.fn();
      const newDispatcher = createDispatcher(client, { onClearStorage: spy });

      newDispatcher.clear();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(newDispatcher);
    });
  });
});
