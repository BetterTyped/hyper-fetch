import { renderHook } from "@testing-library/react-hooks/dom";

import { useFetch } from "hooks";
import { CacheStore } from "cache";
import { startServer, resetMocks, stopServer } from "../../utils/server";
import { getManyRequest, interceptGetMany, interceptGetManyAlternative } from "../../utils/mocks";
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
    CacheStore.clear();
  });

  it("should retry request after 200ms", async () => {
    const mock = interceptGetMany(400);

    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).loading && getCurrentState(responseTwo).loading;
    });

    testFetchErrorState(mock, responseOne);
    testFetchErrorState(mock, responseTwo);

    resetMocks();
    const refreshMock = interceptGetManyAlternative(200);

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).data;
    });

    testFetchSuccessState(refreshMock, responseOne);
    testFetchSuccessState(refreshMock, responseTwo);
  });
});
