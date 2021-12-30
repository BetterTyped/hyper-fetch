import { renderHook, act } from "@testing-library/react-hooks/dom";
import { waitFor } from "@testing-library/react";

import { useFetch } from "hooks";
import { startServer, resetMocks, stopServer } from "../../utils/server";
import { getManyRequest, interceptGetMany, interceptGetManyAlternative } from "../../utils/mocks";
import { ErrorMockType, testBuilder } from "../../utils/server/server.constants";
import { getCurrentState } from "../utils";
import { testFetchErrorState, testFetchInitialState, testFetchSuccessState } from "../shared/fetch.tests";

const renderGetManyHook = () => renderHook(() => useFetch(getManyRequest, { dependencyTracking: false }));

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
    testBuilder.clear();
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

    const newMock = interceptGetManyAlternative(200);

    act(() => {
      responseOne.result.current.refresh();
    });

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    testFetchSuccessState(newMock, responseOne);
    testFetchSuccessState(newMock, responseTwo);
  });

  // Write smaller tests
  it("should allow to use reducer actions to override the state, and emit it for other hooks and propagate state around hooks", async () => {
    const mock = interceptGetMany(200, 0);
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
    await waitFor(() => {
      expect(loadingStateOne.loading).toBe(customLoading);
      expect(loadingStateTwo.loading).toBe(customLoading);
    });

    act(() => {
      successStateOne.actions.setData(customData);
    });
    const dataStateOne = getCurrentState(responseOne);
    const dataStateTwo = getCurrentState(responseTwo);
    await waitFor(() => {
      expect(dataStateOne.data).toEqual(customData);
      expect(dataStateTwo.data).toEqual(customData);
    });

    act(() => {
      successStateOne.actions.setStatus(customStatus);
    });
    const statusStateOne = getCurrentState(responseOne);
    const statusStateTwo = getCurrentState(responseTwo);
    await waitFor(() => {
      expect(statusStateOne.status).toBe(customStatus);
      expect(statusStateTwo.status).toBe(customStatus);
    });

    act(() => {
      successStateOne.actions.setError(customError);
    });
    const errorStateOne = getCurrentState(responseOne);
    const errorStateTwo = getCurrentState(responseTwo);
    await waitFor(() => {
      expect(errorStateOne.error).toBe(customError);
      expect(errorStateTwo.error).toBe(customError);
    });
  });

  // Write smaller tests
  it("should allow to use reducer actions to override only the local state and not affect other related hooks", async () => {
    const mock = interceptGetMany(200, 0);
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
    await waitFor(() => {
      expect(loadingStateOne.loading).toBe(customLoading);
      expect(loadingStateTwo.loading).toBe(successStateTwo.loading);
    });

    act(() => {
      successStateOne.actions.setData(customData, false);
    });
    const dataStateOne = getCurrentState(responseOne);
    const dataStateTwo = getCurrentState(responseTwo);
    await waitFor(() => {
      expect(dataStateOne.data).toBe(customData);
      expect(dataStateTwo.data).toBe(successStateTwo.data);
    });

    act(() => {
      successStateOne.actions.setStatus(customStatus, false);
    });
    const statusStateOne = getCurrentState(responseOne);
    const statusStateTwo = getCurrentState(responseTwo);
    await waitFor(() => {
      expect(statusStateOne.status).toBe(customStatus);
      expect(statusStateTwo.status).toBe(successStateTwo.status);
    });

    act(() => {
      successStateOne.actions.setError(customError, false);
    });
    const errorStateOne = getCurrentState(responseOne);
    const errorStateTwo = getCurrentState(responseTwo);
    await waitFor(() => {
      expect(errorStateOne.error).toBe(customError);
      expect(errorStateTwo.error).toBe(successStateTwo.error);
    });
  });
});
