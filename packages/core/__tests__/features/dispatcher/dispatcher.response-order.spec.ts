import type { RequestInstance } from "request";
import { scopeKey } from "request";

import { createControlledClient, flushPromises } from "../../utils/controlled-adapter.utils";
import { createCacheResponse } from "../../utils/fixtures.utils";

type Data = { value: string };

/**
 * Two requests for the same cache key can be in flight at once, for example a fetch and a refetch.
 * They do not have to answer in the order they were sent - the cache keeps the data of the request sent last.
 */
describe("Dispatcher [ Response order ]", () => {
  const setup = () => {
    const { client, calls } = createControlledClient({ mode: "client" });
    // Not deduplicated, so the same request can be in flight twice - like a fetch and a forced refetch
    const request = client.createRequest<{ response: Data }>()({ endpoint: "/order", deduplicate: false });
    const received: (Data | null)[] = [];
    client.cache.events.onDataByKey<Data, unknown, typeof client.adapter>(request.cacheKey, (data) => {
      received.push(data.data);
    });
    const cached = (scoped: RequestInstance = request) =>
      client.cache.get<Data, unknown>(scopeKey(scoped.cacheKey, scoped.scope));

    /** Send two requests, the second one a moment after the first */
    const sendTwo = async (first: RequestInstance = request, second: RequestInstance = request) => {
      const older = first.send();
      await flushPromises();
      await vi.advanceTimersByTimeAsync(10);
      const newer = second.send();
      await flushPromises();

      return { older, newer };
    };

    return { client, calls, request, received, cached, sendTwo };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("When the request sent later answers first", () => {
    it("should keep its data when the older request answers afterwards", async () => {
      const { calls, cached, received, sendTwo } = setup();
      await sendTwo();

      await calls[1].succeed({ value: "new" });
      await calls[0].succeed({ value: "old" });

      expect(cached()?.data).toStrictEqual({ value: "new" });
      expect(received).toStrictEqual([{ value: "new" }]);
    });

    it("should keep its data when the older request fails afterwards", async () => {
      const { calls, cached, received, sendTwo } = setup();
      await sendTwo();

      await calls[1].succeed({ value: "new" });
      await calls[0].fail({ message: "Too late" });

      expect(cached()?.data).toStrictEqual({ value: "new" });
      expect(cached()?.error).toBeNull();
      expect(received).toStrictEqual([{ value: "new" }]);
    });

    it("should still resolve the older request with its own response", async () => {
      const { calls, sendTwo } = setup();
      const { older, newer } = await sendTwo();

      await calls[1].succeed({ value: "new" });
      await calls[0].succeed({ value: "old" });

      const [newerResponse, olderResponse] = await Promise.all([newer, older]);

      expect(newerResponse.data).toStrictEqual({ value: "new" });
      expect(olderResponse.data).toStrictEqual({ value: "old" });
    });

    it("should still report the response of the older request to its listeners", async () => {
      const { client, calls, sendTwo } = setup();
      const responses: unknown[] = [];
      client.requestManager.events.onResponse(({ response }) => responses.push(response.data));
      await sendTwo();

      await calls[1].succeed({ value: "new" });
      await calls[0].succeed({ value: "old" });

      expect(responses).toStrictEqual([{ value: "new" }, { value: "old" }]);
    });
  });

  describe("When the requests answer in the order they were sent", () => {
    it("should end with the data of the request sent last", async () => {
      const { calls, cached, received, sendTwo } = setup();
      await sendTwo();

      await calls[0].succeed({ value: "old" });
      await calls[1].succeed({ value: "new" });

      expect(cached()?.data).toStrictEqual({ value: "new" });
      expect(received).toStrictEqual([{ value: "old" }, { value: "new" }]);
    });

    it("should replace the data with every next request", async () => {
      const { calls, cached, request } = setup();

      for (const value of ["first", "second", "third"]) {
        request.send();
        // eslint-disable-next-line no-await-in-loop
        await flushPromises();
        // eslint-disable-next-line no-await-in-loop
        await calls.at(-1)?.succeed({ value });
        // eslint-disable-next-line no-await-in-loop
        await vi.advanceTimersByTimeAsync(10);
      }

      expect(cached()?.data).toStrictEqual({ value: "third" });
    });
  });

  describe("When the requests were sent at the very same moment", () => {
    it("should keep the data of the one that was sent last", async () => {
      const { calls, cached, request } = setup();
      request.send();
      request.send();
      await flushPromises();

      await calls[1].succeed({ value: "second" });
      await calls[0].succeed({ value: "first" });

      expect(cached()?.data).toStrictEqual({ value: "second" });
    });
  });

  describe("When the request sent later brings no data", () => {
    it("should accept the data of the older request after the newer one failed", async () => {
      const { calls, cached, sendTwo } = setup();
      await sendTwo();

      await calls[1].fail({ message: "Failed" });
      await calls[0].succeed({ value: "old" });

      expect(cached()?.data).toStrictEqual({ value: "old" });
      expect(cached()?.error).toBeNull();
    });

    it("should accept the data of the older request after the newer one was aborted", async () => {
      const { client, calls, cached, received, sendTwo } = setup();
      await sendTwo();

      client.requestManager.abortByRequestId(calls[1].request.abortKey, calls[1].requestId);
      await flushPromises();
      await calls[0].succeed({ value: "old" });

      expect(cached()?.data).toStrictEqual({ value: "old" });
      expect(received.at(-1)).toStrictEqual({ value: "old" });
    });

    it("should keep working after the dispatcher is cleared", async () => {
      const { client, calls, cached, request, sendTwo } = setup();
      await sendTwo();
      await calls[1].succeed({ value: "new" });
      await calls[0].succeed({ value: "old" });

      client.fetchDispatcher.clear();
      request.send();
      await flushPromises();
      await calls[2].succeed({ value: "after the clear" });

      expect(cached()?.data).toStrictEqual({ value: "after the clear" });
    });
  });

  describe("When the requests do not share the cached element", () => {
    it("should keep both responses of requests with different cache keys", async () => {
      const { client, calls, request, cached, sendTwo } = setup();
      const other = client.createRequest<{ response: Data }>()({ endpoint: "/other", deduplicate: false });
      await sendTwo(request, other);

      await calls[1].succeed({ value: "other" });
      await calls[0].succeed({ value: "order" });

      expect(cached(request)?.data).toStrictEqual({ value: "order" });
      expect(cached(other)?.data).toStrictEqual({ value: "other" });
    });

    it("should keep both responses of the same request in different scopes", async () => {
      const { calls, request, cached, sendTwo } = setup();
      const userA = request.setScope("user-a");
      const userB = request.setScope("user-b");
      await sendTwo(userA, userB);

      await calls[1].succeed({ value: "b" });
      await calls[0].succeed({ value: "a" });

      expect(cached(userA)?.data).toStrictEqual({ value: "a" });
      expect(cached(userB)?.data).toStrictEqual({ value: "b" });
    });
  });

  describe("When the data was set by hand while the request was in flight", () => {
    it("should replace it with the response - the data set by hand does not come from a request", async () => {
      const { client, calls, request, cached } = setup();
      request.send();
      await flushPromises();
      await vi.advanceTimersByTimeAsync(10);
      const now = Date.now();
      client.cache.set(request, {
        ...createCacheResponse<Data>({ value: "set by hand" }),
        requestTimestamp: now,
        responseTimestamp: now,
      });

      await calls[0].succeed({ value: "from the server" });

      expect(cached()?.data).toStrictEqual({ value: "from the server" });
    });

    it("should replace the data that was updated in place", async () => {
      const { client, calls, request, cached } = setup();
      request.send();
      await flushPromises();
      await calls[0].succeed({ value: "first" });
      await vi.advanceTimersByTimeAsync(10);
      request.send();
      await flushPromises();
      await vi.advanceTimersByTimeAsync(10);
      // An update keeps the timestamps of the element, so the request in flight is still the newer one
      client.cache.update(request, { data: { value: "optimistic" } });

      await calls[1].succeed({ value: "from the server" });

      expect(cached()?.data).toStrictEqual({ value: "from the server" });
    });
  });
});
