import { createHttpMockingServer } from "@hyper-fetch/testing";

import { QueueDataType } from "dispatcher";
import { createDispatcher } from "../../utils";
import { Client } from "client";
import { Plugin } from "plugin";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Dispatcher [ Basic ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-endpoint" });
    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When lifecycle events get triggered", () => {
    it("should allow to change storage", async () => {
      const storage = new Map<string, QueueDataType<any>>();
      const newDispatcher = createDispatcher(client, { storage });

      const dispatcherDump = newDispatcher.createStorageItem(request);
      newDispatcher.addQueueItem(request.queryKey, dispatcherDump);

      expect(storage.get(request.queryKey)?.requests[0]).toBe(dispatcherDump);
    });
    it("should trigger on queue change callback", async () => {
      const spy = jest.fn();
      const plugin = new Plugin({ name: "change" }).onDispatcherQueueRunning(spy);
      const newDispatcher = createDispatcher(client.addPlugin(plugin));

      newDispatcher.stop(request.queryKey);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        dispatcher: newDispatcher,
        queue: { queryKey: request.queryKey, requests: [], stopped: true },
        status: "stopped",
      });
    });
    it("should trigger on add and delete callback", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const plugin1 = new Plugin({ name: "add" }).onDispatcherItemAdded(spy1);
      const plugin2 = new Plugin({ name: "delete" }).onDispatcherItemDeleted(spy2);
      const plugin3 = new Plugin({ name: "clear" }).onDispatcherQueueCleared(spy3);
      const newDispatcher = createDispatcher(client.addPlugin(plugin1).addPlugin(plugin2).addPlugin(plugin3));
      const dispatcherDump = newDispatcher.createStorageItem(request);

      newDispatcher.addQueueItem(request.queryKey, dispatcherDump);
      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy1).toHaveBeenCalledWith({
        dispatcher: newDispatcher,
        queue: { queryKey: request.queryKey, requests: [dispatcherDump], stopped: false },
        queueItem: dispatcherDump,
      });

      newDispatcher.delete(request.queryKey, dispatcherDump.requestId, request.abortKey);
      expect(spy2).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledWith({
        dispatcher: newDispatcher,
        queue: { queryKey: request.queryKey, requests: [], stopped: false },
        queueItem: dispatcherDump,
      });

      newDispatcher.addQueueItem(request.queryKey, dispatcherDump);

      expect(spy1).toHaveBeenCalledTimes(2);
      expect(spy1).toHaveBeenCalledWith({
        dispatcher: newDispatcher,
        queue: { queryKey: request.queryKey, requests: [dispatcherDump], stopped: false },
        queueItem: dispatcherDump,
      });

      newDispatcher.clearQueue(request.queryKey);

      expect(spy3).toHaveBeenCalledTimes(1);
      expect(spy3).toHaveBeenCalledWith({
        dispatcher: newDispatcher,
        queue: { queryKey: request.queryKey, requests: [], stopped: false },
      });
    });
    it("should trigger onClearStorage callback", async () => {
      const spy = jest.fn();
      const plugin = new Plugin({ name: "clear" }).onDispatcherCleared(spy);
      const newDispatcher = createDispatcher(client.addPlugin(plugin));

      newDispatcher.clear();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ dispatcher: newDispatcher });
    });
  });
});
