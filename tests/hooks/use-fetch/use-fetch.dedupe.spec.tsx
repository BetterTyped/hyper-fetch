import { waitFor } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react-hooks/dom";

import { useFetch } from "hooks";
import { getCacheKey, getCacheEndpointKey } from "cache";
import { startServer, resetMocks, stopServer, testBuilder } from "../../utils/server";
import { getManyMock, getManyRequest } from "../../utils/mocks";
import { interceptGetMany, GetManyResponseType } from "../../utils/mocks/get-many.mock";

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
    jest.spyOn(testBuilder, "client");
    testBuilder.clear();
  });

  it("should initialize with cache values without making any request", async () => {
    interceptGetMany(200);

    const endpointKey = getCacheEndpointKey(getManyRequest);
    const requestKey = getCacheKey(getManyRequest);

    act(() => {
      testBuilder.cache.set<GetManyResponseType>({
        endpointKey,
        requestKey,
        response: [fixture, null, 200],
        retries: 0,
        isRefreshed: false,
      });
    });

    renderHook(() => useFetch(getManyRequest));

    expect(testBuilder.client).toHaveBeenCalledTimes(0);
  });

  it("should deduplicate 2 fetches into one request", async () => {
    interceptGetMany(200);
    renderHook(() => useFetch(getManyRequest));
    renderHook(() => useFetch(getManyRequest));
    await waitFor(() => {
      expect(testBuilder.client).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(testBuilder.client).toHaveBeenCalledTimes(1);
  });
});
