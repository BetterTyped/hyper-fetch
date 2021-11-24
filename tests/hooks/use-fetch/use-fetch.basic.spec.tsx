import { renderHook, act } from "@testing-library/react-hooks/dom";

import { useFetch } from "hooks";
import { CacheStore } from "cache";
import { startServer, resetMocks, stopServer } from "../../utils/server";
import { getManyRequest, interceptGetMany } from "../../utils/mocks";
import { ErrorMockType } from "../../utils/server/server.constants";
import { getCurrentState } from "../utils";
import { testFetchErrorState, testFetchInitialState, testFetchSuccessState } from "../shared/fetch.tests";

const renderGetManyHook = () => renderHook(() => useFetch(getManyRequest));

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
    CacheStore.clear();
  });

  it("should initialize in loading state", () => {
    interceptGetMany(200);

    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    testFetchInitialState(responseOne);
    testFetchInitialState(responseTwo);
  });

  it("should change state once data is fetched", async () => {
    const mock = interceptGetMany(200);
    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading && getCurrentState(responseTwo).loading;
    });

    testFetchSuccessState(mock, responseOne);
    testFetchSuccessState(mock, responseTwo);
  });

  it("should update error state once api call fails", async () => {
    const mock = interceptGetMany(400);
    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading && getCurrentState(responseTwo).loading;
    });

    testFetchErrorState(mock, responseOne);
    testFetchErrorState(mock, responseTwo);
  });

  it("should fetch new data once refresh method gets triggered", async () => {
    const mock = interceptGetMany(200);
    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    testFetchInitialState(responseOne);
    testFetchInitialState(responseTwo);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    testFetchSuccessState(mock, responseOne);
    testFetchSuccessState(mock, responseTwo);

    act(() => {
      responseOne.result.current.refresh();
    });

    const loadingStateOne = getCurrentState(responseOne);
    const loadingStateTwo = getCurrentState(responseTwo);

    expect(loadingStateOne.loading).toEqual(true);
    expect(loadingStateTwo.loading).toEqual(true);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    testFetchSuccessState(mock, responseOne);
    testFetchSuccessState(mock, responseTwo);
  });

  // Write smaller tests
  it("should allow to use reducer actions to override the state, and emit it for other hooks and propagate state around hooks", async () => {
    const mock = interceptGetMany(200);
    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    testFetchInitialState(responseOne);
    testFetchInitialState(responseTwo);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    const successStateOne = getCurrentState(responseOne);

    testFetchSuccessState(mock, responseOne);
    testFetchSuccessState(mock, responseTwo);

    const customLoading = true;
    const customData: typeof mock = [{ name: "Albert", age: 999 }];
    const customStatus = 666;
    const customError: ErrorMockType = { message: "custom error" };

    act(() => {
      successStateOne.actions.setLoading(customLoading);
    });
    const loadingStateOne = getCurrentState(responseOne);
    const loadingStateTwo = getCurrentState(responseTwo);
    await new Promise((r) => setTimeout(r, 50));
    expect(loadingStateOne.loading).toBe(customLoading);
    expect(loadingStateTwo.loading).toBe(customLoading);

    act(() => {
      successStateOne.actions.setData(customData);
    });
    const dataStateOne = getCurrentState(responseOne);
    const dataStateTwo = getCurrentState(responseTwo);
    await new Promise((r) => setTimeout(r, 50));
    expect(dataStateOne.data).toBe(customData);
    expect(dataStateTwo.data).toBe(customData);

    act(() => {
      successStateOne.actions.setStatus(customStatus);
    });
    const statusStateOne = getCurrentState(responseOne);
    const statusStateTwo = getCurrentState(responseTwo);
    await new Promise((r) => setTimeout(r, 50));
    expect(statusStateOne.status).toBe(customStatus);
    expect(statusStateTwo.status).toBe(customStatus);

    act(() => {
      successStateOne.actions.setError(customError);
    });
    const errorStateOne = getCurrentState(responseOne);
    const errorStateTwo = getCurrentState(responseTwo);
    await new Promise((r) => setTimeout(r, 50));
    expect(errorStateOne.error).toBe(customError);
    expect(errorStateTwo.error).toBe(customError);
  });

  // Write smaller tests
  it("should allow to use reducer actions to override only the local state and not affect other related hooks", async () => {
    const mock = interceptGetMany(200);
    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    testFetchInitialState(responseOne);
    testFetchInitialState(responseTwo);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    const successStateOne = getCurrentState(responseOne);
    const successStateTwo = getCurrentState(responseTwo);

    testFetchSuccessState(mock, responseOne);
    testFetchSuccessState(mock, responseTwo);

    const customLoading = true;
    const customData: typeof mock = [{ name: "Albert", age: 999 }];
    const customStatus = 666;
    const customError: ErrorMockType = { message: "custom error" };

    act(() => {
      successStateOne.actions.setLoading(customLoading, false);
    });
    const loadingStateOne = getCurrentState(responseOne);
    const loadingStateTwo = getCurrentState(responseTwo);
    await new Promise((r) => setTimeout(r, 50));
    expect(loadingStateOne.loading).toBe(customLoading);
    expect(loadingStateTwo.loading).toBe(successStateTwo.loading);

    act(() => {
      successStateOne.actions.setData(customData, false);
    });
    const dataStateOne = getCurrentState(responseOne);
    const dataStateTwo = getCurrentState(responseTwo);
    await new Promise((r) => setTimeout(r, 50));
    expect(dataStateOne.data).toBe(customData);
    expect(dataStateTwo.data).toBe(successStateTwo.data);

    act(() => {
      successStateOne.actions.setStatus(customStatus, false);
    });
    const statusStateOne = getCurrentState(responseOne);
    const statusStateTwo = getCurrentState(responseTwo);
    await new Promise((r) => setTimeout(r, 50));
    expect(statusStateOne.status).toBe(customStatus);
    expect(statusStateTwo.status).toBe(successStateTwo.status);

    act(() => {
      successStateOne.actions.setError(customError, false);
    });
    const errorStateOne = getCurrentState(responseOne);
    const errorStateTwo = getCurrentState(responseTwo);
    await new Promise((r) => setTimeout(r, 50));
    expect(errorStateOne.error).toBe(customError);
    expect(errorStateTwo.error).toBe(successStateTwo.error);
  });
});
