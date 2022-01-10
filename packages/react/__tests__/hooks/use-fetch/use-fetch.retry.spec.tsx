import { renderHook } from "@testing-library/react-hooks/dom";

import { useFetch } from "use-fetch";
import { startServer, resetMocks, stopServer, testBuilder } from "../../utils/server";
import { getManyRequest, interceptGetMany, interceptGetManyAlternative } from "../../utils/mocks";
import { getCurrentState } from "../../utils/utils/state.utils";
import { testFetchErrorState, testFetchSuccessState } from "../../shared/fetch.tests";

const request = getManyRequest.setRetry(1).setRetryTime(200);

const renderGetManyHook = () => renderHook(() => useFetch(request, { dependencyTracking: false }));

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
    testBuilder.clear();
  });

  it("should retry request after 200ms", async () => {
    const mock = interceptGetMany(400);

    const responseOne = renderGetManyHook();
    const responseTwo = renderGetManyHook();

    await responseOne.waitForValueToChange(() => {
      return getCurrentState(responseOne).error;
    });

    testFetchErrorState(mock, responseOne);
    testFetchErrorState(mock, responseTwo);

    resetMocks();
    const refreshMock = interceptGetManyAlternative(200);

    await responseOne.waitForValueToChange(() => {
      return Boolean(getCurrentState(responseOne).data);
    });

    testFetchSuccessState(refreshMock, responseOne);
    testFetchSuccessState(refreshMock, responseTwo);
  });
});
