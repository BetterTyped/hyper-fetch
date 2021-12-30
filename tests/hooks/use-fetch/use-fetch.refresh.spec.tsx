import { renderHook, act } from "@testing-library/react-hooks/dom";

import { useFetch } from "hooks";
import { startServer, resetMocks, stopServer } from "../../utils/server";
import { getManyRequest, interceptGetMany, interceptGetManyAlternative } from "../../utils/mocks";
import { getCurrentState } from "../utils/state.utils";
import { testFetchSuccessState, testRefreshFetchErrorState, testRefreshFetchSuccessState } from "../shared/fetch.tests";
import { testBuilder } from "../../utils/server/server.constants";

const renderGetManyHook = () =>
  renderHook(() =>
    useFetch(getManyRequest, {
      dependencyTracking: false,
      refresh: true,
      refreshTime: 200,
      refreshBlurred: true,
      refreshOnReconnect: true,
      refreshOnTabBlur: true,
      refreshOnTabFocus: true,
    }),
  );

const renderEventsHook = () =>
  renderHook(() =>
    useFetch(getManyRequest, {
      dependencyTracking: false,
      refresh: false,
      refreshBlurred: true,
      refreshOnReconnect: true,
      refreshOnTabBlur: true,
      refreshOnTabFocus: true,
    }),
  );

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
    testBuilder.clear();
  });

  it("should refetch data after refresh time of 200ms", async () => {
    const mock = interceptGetMany(200);

    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading && getCurrentState(responseTwo).loading;
    });

    testFetchSuccessState(mock, responseOne);
    testFetchSuccessState(mock, responseTwo);

    resetMocks();
    const refreshMock = interceptGetManyAlternative(200);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    testRefreshFetchSuccessState(refreshMock, responseOne);
    testRefreshFetchSuccessState(refreshMock, responseTwo);

    resetMocks();
    const reRefreshMock = interceptGetMany(200);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    testRefreshFetchSuccessState(reRefreshMock, responseOne);
    testRefreshFetchSuccessState(reRefreshMock, responseTwo);
  });

  it("should save refresh error to separate container", async () => {
    const mock = interceptGetMany(200);

    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading && getCurrentState(responseTwo).loading;
    });

    testFetchSuccessState(mock, responseOne);
    testFetchSuccessState(mock, responseTwo);

    resetMocks();
    const refreshMock = interceptGetManyAlternative(200);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    testRefreshFetchSuccessState(refreshMock, responseOne);
    testRefreshFetchSuccessState(refreshMock, responseTwo);

    resetMocks();
    const reRefreshMock = interceptGetMany(400);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).refreshError;
    });

    testRefreshFetchErrorState(reRefreshMock, responseOne);
    testRefreshFetchErrorState(reRefreshMock, responseTwo);
  });

  it("should refresh on tab focus", async () => {
    const mock = interceptGetMany(200);

    const responseOne = renderEventsHook();
    const responseTwo = renderEventsHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading && getCurrentState(responseTwo).loading;
    });

    testFetchSuccessState(mock, responseOne);
    testFetchSuccessState(mock, responseTwo);

    resetMocks();
    const refreshMock = interceptGetManyAlternative(200);

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    testRefreshFetchSuccessState(refreshMock, responseOne);
    testRefreshFetchSuccessState(refreshMock, responseTwo);
  });

  it("should refresh on tab blur", async () => {
    const mock = interceptGetMany(200);

    const responseOne = renderEventsHook();
    const responseTwo = renderEventsHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading && getCurrentState(responseTwo).loading;
    });

    testFetchSuccessState(mock, responseOne);
    testFetchSuccessState(mock, responseTwo);

    resetMocks();
    const refreshMock = interceptGetManyAlternative(200);

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    testRefreshFetchSuccessState(refreshMock, responseOne);
    testRefreshFetchSuccessState(refreshMock, responseTwo);
  });

  it("should refresh on reconnect", async () => {
    const mock = interceptGetMany(200);

    const responseOne = renderEventsHook();
    const responseTwo = renderEventsHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading;
    });

    testFetchSuccessState(mock, responseOne);
    testFetchSuccessState(mock, responseTwo);

    resetMocks();
    const refreshMock = interceptGetManyAlternative(200);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    testRefreshFetchSuccessState(refreshMock, responseOne);
    testRefreshFetchSuccessState(refreshMock, responseTwo);
  });
});
