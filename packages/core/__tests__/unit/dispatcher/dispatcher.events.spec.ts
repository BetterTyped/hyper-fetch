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
      dispatcher.add(command.setConcurrent(false));
      await sleep(40);
      expect(spy).toBeCalledTimes(1);
      unmount();
      dispatcher.add(command.setConcurrent(false));
      await sleep(40);
      expect(spy).toBeCalledTimes(1);
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
  });
});
