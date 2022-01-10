import { waitFor } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react-hooks/dom";
import { getCacheRequestKey, DateInterval } from "@better-typed/hyper-fetch";

import { useFetch } from "use-fetch";
import { startServer, resetMocks, stopServer, testBuilder } from "../../utils/server";
import { getManyMock, getManyRequest } from "../../utils/mocks";
import { interceptGetMany, GetManyResponseType } from "../../utils/mocks/get-many.mock";
import { sleep } from "../../utils/utils";

const request = getManyRequest.setCacheTime(DateInterval.second * 10);
const renderGetManyHook = () => renderHook(() => useFetch(request, { dependencyTracking: false }));
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

    const requestKey = getCacheRequestKey(request);

    act(() => {
      testBuilder.cache.set<GetManyResponseType>({
        cacheKey: request.cacheKey,
        requestKey,
        response: [fixture, null, 200],
        retries: 0,
        isRefreshed: false,
      });
    });

    renderGetManyHook();

    expect(testBuilder.client).toHaveBeenCalledTimes(0);
  });

  it("should deduplicate 2 fetches into one request", async () => {
    interceptGetMany(200);
    renderGetManyHook();
    renderGetManyHook();
    await waitFor(() => {
      expect(testBuilder.client).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await sleep(100);
    });
    expect(testBuilder.client).toHaveBeenCalledTimes(1);
  });
});
