import { createDispatcher, createBuilder, createClient } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("Dispatcher [ Utils ]", () => {
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

  describe("When using request counting methods", () => {
    it("should increment request count", async () => {
      const queueKey = "test";
      expect(dispatcher.getQueueRequestCount(queueKey)).toBe(0);
      dispatcher.incrementQueueRequestCount(queueKey);
      expect(dispatcher.getQueueRequestCount(queueKey)).toBe(1);
    });
  });
});
