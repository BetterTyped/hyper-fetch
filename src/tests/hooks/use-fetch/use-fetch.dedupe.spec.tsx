import { renderHook } from "@testing-library/react-hooks";

import { useFetch } from "hooks";
import { CACHE_EVENTS, Cache, getCacheKey } from "cache";
import { startServer, resetMocks, stopServer, setToken } from "tests/server";
import { getManyMock, getManyRequest } from "tests/mocks";
import { getCurrentState, mockMiddleware } from "../utils";
import { testFetchSuccessState } from "../shared/fetch.tests";

describe("Basic useFetch hook usage", () => {
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
    CACHE_EVENTS.destroy();
  });

  it("should initialize with cache values without making any request", async () => {
    const { fixture } = getManyMock();

    const cache = new Cache(getManyRequest);
    const cacheKey = getCacheKey(getManyRequest);
    cache.set({
      key: cacheKey,
      response: [fixture, null, 200],
      retries: 0,
      isRefreshed: false,
    });

    const mockedFetch = jest.fn(() => [fixture, null, 200]);
    const render = () => renderHook(() => useFetch(mockMiddleware(getManyRequest, mockedFetch)));

    const response = render();
    const state = getCurrentState(response);

    expect(mockedFetch).not.toHaveBeenCalled();
    testFetchSuccessState(fixture, state);
  });
});
