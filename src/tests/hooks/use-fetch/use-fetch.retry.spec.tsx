import { renderHook } from "@testing-library/react-hooks";

import { useFetch } from "hooks";
import { CacheStore } from "cache";
import { startServer, resetMocks, stopServer, setToken } from "tests/utils/server";
import { getManyRequest, interceptGetMany, interceptGetManyAlternative } from "tests/utils/mocks";
import { getCurrentState } from "../utils/state.utils";
import { testFetchErrorState, testFetchSuccessState } from "../shared/fetch.tests";

const renderGetManyHook = () => renderHook(() => useFetch(getManyRequest, { retry: 1, retryTime: 200 }));

describe("useFetch hook retry logic", () => {
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

  it("should retry request after 200ms", async () => {
    const mock = interceptGetMany(400);

    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading;
    });

    const stateOne = getCurrentState(responseOne);
    const stateTwo = getCurrentState(responseTwo);

    testFetchErrorState(mock, stateOne);
    testFetchErrorState(mock, stateTwo);

    resetMocks();
    const refreshMock = interceptGetManyAlternative(200);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    const retryStateOne = getCurrentState(responseOne);
    const retryStateTwo = getCurrentState(responseTwo);

    testFetchSuccessState(refreshMock, retryStateOne);
    testFetchSuccessState(refreshMock, retryStateTwo);
  });
});
