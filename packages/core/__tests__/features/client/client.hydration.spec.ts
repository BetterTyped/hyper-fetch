import { Client } from "client";

describe("Client [ Hydration ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" });
  });

  describe("When using hydrate", () => {
    it("should not dehydrate from empty cache", async () => {
      const dehydratedResponse = request.dehydrate();

      expect(dehydratedResponse).toBeUndefined();
    });
    it("should dehydrate from cache", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      const response = await mockedRequest.send();

      const dehydratedResponse = mockedRequest.dehydrate();

      expect(dehydratedResponse).toStrictEqual(expect.objectContaining({ cacheKey: request.cacheKey, response }));

      const newClient = new Client({ url: "shared-base-url" });

      expect(newClient.cache.get(mockedRequest.cacheKey)).not.toBeDefined();

      newClient.hydrate([dehydratedResponse]);

      expect(newClient.cache.get(mockedRequest.cacheKey)).toStrictEqual(
        expect.objectContaining({ ...response, cacheKey: request.cacheKey, staleTime: request.staleTime }),
      );
    });
    it("should dehydrate from response", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      const response = await mockedRequest.send();

      const dehydratedResponse = mockedRequest.dehydrate({ response });

      expect(dehydratedResponse).toStrictEqual(expect.objectContaining({ cacheKey: request.cacheKey, response }));

      const newClient = new Client({ url: "shared-base-url" });

      expect(newClient.cache.get(mockedRequest.cacheKey)).not.toBeDefined();

      newClient.hydrate([dehydratedResponse]);

      expect(newClient.cache.get(mockedRequest.cacheKey)).toStrictEqual(
        expect.objectContaining({ ...response, cacheKey: request.cacheKey, staleTime: request.staleTime }),
      );
    });
    it("should not override cache data", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      const response = await mockedRequest.send();

      const dehydratedResponse = mockedRequest.dehydrate({ response, override: false });

      expect(dehydratedResponse).toStrictEqual(expect.objectContaining({ cacheKey: request.cacheKey, response }));

      const newClient = new Client({ url: "shared-base-url" });
      const cacheData = {
        data: "123456789",
        status: 200,
        error: null,
        success: true,
        extra: {},
        responseTimestamp: +new Date(),
        requestTimestamp: +new Date(),
        addedTimestamp: +new Date(),
        triggerTimestamp: +new Date(),
        retries: 0,
        isCanceled: false,
        isOffline: false,
        hydrated: false,
      };

      newClient.cache.set(mockedRequest, cacheData);

      expect(newClient.cache.get(mockedRequest.cacheKey)).toStrictEqual({
        ...cacheData,
        cacheKey: mockedRequest.cacheKey,
        cacheTime: mockedRequest.cacheTime,
        staleTime: mockedRequest.staleTime,
        version: newClient.cache.version,
      });

      newClient.hydrate([dehydratedResponse]);

      expect(newClient.cache.get(mockedRequest.cacheKey)).toStrictEqual({
        ...cacheData,
        cacheKey: mockedRequest.cacheKey,
        cacheTime: mockedRequest.cacheTime,
        staleTime: mockedRequest.staleTime,
        version: newClient.cache.version,
      });
    });
  });
});
