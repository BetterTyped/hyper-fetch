import { waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks/dom";

import { useFetch } from "hooks";
import { Cache, getCacheKey } from "cache";
import { startServer, resetMocks, stopServer, testBuilder } from "../../utils/server";
import { getManyMock, getManyRequest } from "../../utils/mocks";
import { interceptGetMany } from "../../utils/mocks/get-many.mock";

const { fixture } = getManyMock();
describe("useFetch hook deduplicate logic", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(async () => {
    jest.spyOn(getManyRequest.builderConfig, "client");
    testBuilder.clear();
  });

  it("should initialize with cache values without making any request", async () => {
    interceptGetMany(200);

    const cache = new Cache(getManyRequest);
    const cacheKey = getCacheKey(getManyRequest);
    cache.set({
      key: cacheKey,
      response: [fixture, null, 200],
      retries: 0,
      isRefreshed: false,
    });

    renderHook(() => useFetch(getManyRequest));

    expect(getManyRequest.builderConfig.client).toHaveBeenCalledTimes(0);
  });

  it("should deduplicate 2 fetches into one request", async () => {
    interceptGetMany(200);
    renderHook(() => useFetch(getManyRequest));
    renderHook(() => useFetch(getManyRequest));

    await waitFor(() => {
      expect(getManyRequest.builderConfig.client).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(getManyRequest.builderConfig.client).not.toHaveBeenCalledTimes(2);
    });
  });
});
