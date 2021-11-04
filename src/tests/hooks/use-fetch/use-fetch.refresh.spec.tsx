import { renderHook } from "@testing-library/react-hooks";

import { useFetch } from "hooks";
import { CACHE_EVENTS } from "cache";
import { startServer, resetMocks, stopServer, setToken } from "tests/server";
import { getManyRequest, interceptGetMany, interceptGetManyAlternative } from "tests/mocks";
import { getCurrentState } from "../utils/state.utils";
import { testFetchSuccessState, testRefreshFetchErrorState, testRefreshFetchSuccessState } from "../shared/fetch.tests";

const renderGetManyHook = () => renderHook(() => useFetch(getManyRequest, { refresh: true, refreshTime: 200 }));

describe("useFetch hook refresh logic", () => {
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

  it("should refetch data after refresh time of 200ms", async () => {
    const mock = interceptGetMany(200);

    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading;
    });

    const stateOne = getCurrentState(responseOne);
    const stateTwo = getCurrentState(responseTwo);

    testFetchSuccessState(mock, stateOne);
    testFetchSuccessState(mock, stateTwo);

    resetMocks();
    const refreshMock = interceptGetManyAlternative(200);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    const refreshedStateOne = getCurrentState(responseOne);
    const refreshedStateTwo = getCurrentState(responseTwo);

    testRefreshFetchSuccessState(refreshMock, refreshedStateOne);
    testRefreshFetchSuccessState(refreshMock, refreshedStateTwo);

    resetMocks();
    const reRefreshMock = interceptGetMany(200);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    const reRefreshedStateOne = getCurrentState(responseOne);
    const reRefreshedStateTwo = getCurrentState(responseTwo);

    testRefreshFetchSuccessState(reRefreshMock, reRefreshedStateOne);
    testRefreshFetchSuccessState(reRefreshMock, reRefreshedStateTwo);
  });

  it("should save refresh error to separate container", async () => {
    const mock = interceptGetMany(200);

    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading;
    });

    const stateOne = getCurrentState(responseOne);
    const stateTwo = getCurrentState(responseTwo);

    testFetchSuccessState(mock, stateOne);
    testFetchSuccessState(mock, stateTwo);

    resetMocks();
    const refreshMock = interceptGetManyAlternative(200);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    const refreshedStateOne = getCurrentState(responseOne);
    const refreshedStateTwo = getCurrentState(responseTwo);

    testRefreshFetchSuccessState(refreshMock, refreshedStateOne);
    testRefreshFetchSuccessState(refreshMock, refreshedStateTwo);

    resetMocks();
    const reRefreshMock = interceptGetMany(400);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).refreshError;
    });

    const reRefreshedStateOne = getCurrentState(responseOne);
    const reRefreshedStateTwo = getCurrentState(responseTwo);

    testRefreshFetchErrorState(reRefreshMock, reRefreshedStateOne);
    testRefreshFetchErrorState(reRefreshMock, reRefreshedStateTwo);
  });
});
