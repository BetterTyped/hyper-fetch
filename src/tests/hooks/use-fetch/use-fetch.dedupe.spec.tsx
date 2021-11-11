import { waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";

import { useFetch } from "hooks";
import { CacheStore, Cache, getCacheKey } from "cache";
import { startServer, resetMocks, stopServer, setToken } from "tests/server";
import { getManyMock, getManyRequest } from "tests/mocks";

const { fixture } = getManyMock();
jest.spyOn(getManyRequest, "fetch");

describe("useFetch hook deduplicate logic", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(async () => {
    setToken();
    CacheStore.clear();
  });

  it("should initialize with cache values without making any request", async () => {
    const cache = new Cache(getManyRequest);
    const cacheKey = getCacheKey(getManyRequest);
    cache.set({
      key: cacheKey,
      response: [fixture, null, 200],
      retries: 0,
      isRefreshed: false,
    });

    renderHook(() => useFetch(getManyRequest));

    await waitFor(() => {
      expect(getManyRequest.fetch).toHaveBeenCalledTimes(0);
    });
  });

  it("should deduplicate 2 fetches into one request", async () => {
    renderHook(() => useFetch(getManyRequest));
    renderHook(() => useFetch(getManyRequest));

    await waitFor(() => {
      expect(getManyRequest.fetch).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(getManyRequest.fetch).not.toHaveBeenCalledTimes(2);
    });
  });
});
