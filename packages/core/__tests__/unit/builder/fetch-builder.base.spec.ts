import { Cache } from "cache";
import { Queue } from "queue";
import { AppManager } from "managers";
import { createBuilder, interceptorCallback } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("FetchBuilder [ Base ]", () => {
  let builderInstance = createBuilder();

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    builderInstance = createBuilder();
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When builder properties are passed", () => {
    it("should assign baseUrl", async () => {
      const baseUrl = "test-123";
      const builder = createBuilder({ baseUrl });

      expect(builder.baseUrl).toBe(baseUrl);
    });
    it("should assign new client", async () => {
      const client = () => interceptorCallback()();
      const builder = createBuilder({ client });

      expect(builder.client).toBe(client);
    });
    it("should assign new appManager", async () => {
      const appManager = new AppManager(builderInstance);
      const builder = createBuilder({ appManager: () => appManager });

      expect(builder.appManager).toBe(appManager);
    });
    it("should assign new cache", async () => {
      const cache = new Cache(builderInstance);
      const builder = createBuilder({ cache: () => cache });

      expect(builder.cache).toBe(cache);
    });
    it("should assign new fetchQueue", async () => {
      const fetchQueue = new Queue(builderInstance);
      const builder = createBuilder({ fetchQueue: () => fetchQueue });

      expect(builder.fetchQueue).toBe(fetchQueue);
    });
    it("should assign new submitQueue", async () => {
      const submitQueue = new Queue(builderInstance);
      const builder = createBuilder({ submitQueue: () => submitQueue });

      expect(builder.submitQueue).toBe(submitQueue);
    });
  });
});
