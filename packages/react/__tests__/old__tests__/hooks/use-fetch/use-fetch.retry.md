// import { renderHook } from "@testing-library/react-hooks/dom"; // import { FetchCommandInstance } from
"@better-typed/hyper-fetch"; // import { waitFor } from "@testing-library/react";

// import { useFetch } from "use-fetch"; // import { startServer, resetMocks, stopServer, testBuilder } from
"../../utils/server"; // import { getManyRequest, interceptGetMany, interceptGetManyAlternative } from
"../../utils/mocks"; // import { getCurrentState } from "../../utils/utils/state.utils"; // import {
testFetchErrorState, testFetchSuccessState } from "../../shared/fetch.tests"; // import { sleep } from
"../../utils/utils";

// const request = getManyRequest.setRetry(1).setRetryTime(100); // const requestNoRetry =
getManyRequest.setRetry(false);

// const renderGetManyHook = (req: FetchCommandInstance = request) => // renderHook(() => useFetch(req, {
dependencyTracking: false }));

// describe("useFetch hook retry logic", () => { // beforeAll(() => { // startServer(); // });

// afterEach(() => { // resetMocks(); // });

// afterAll(() => { // stopServer(); // });

// beforeEach(async () => { // testBuilder.clear(); // });

// it("should not retry request when option is set to false", async () => { // const mock = interceptGetMany(400, 0);

// const responseOne = await renderGetManyHook(requestNoRetry); // const responseTwo = await
renderGetManyHook(requestNoRetry);

// await responseOne.waitForValueToChange(() => { // return getCurrentState(responseOne).error; // });

// testFetchErrorState(mock, responseOne); // testFetchErrorState(mock, responseTwo);

// resetMocks(); // interceptGetManyAlternative(200);

// await sleep(200);

// testFetchErrorState(mock, responseOne); // testFetchErrorState(mock, responseTwo); // });

// it("should retry request after 100ms", async () => { // const mock = interceptGetMany(400);

// const responseOne = await renderGetManyHook(); // const responseTwo = await renderGetManyHook();

// await responseOne.waitForValueToChange(() => { // return getCurrentState(responseOne).error; // });

// testFetchErrorState(mock, responseOne); // testFetchErrorState(mock, responseTwo);

// resetMocks(); // const refreshMock = interceptGetManyAlternative(200);

// await waitFor(() => { // expect(getCurrentState(responseOne).data).toBeTruthy(); // });

// testFetchSuccessState(refreshMock, responseOne); // testFetchSuccessState(refreshMock, responseTwo); // }); // });
