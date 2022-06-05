// import { renderHook, act } from "@testing-library/react-hooks/dom"; // import { waitFor } from
"@testing-library/react"; // import { Builder } from "@better-typed/hyper-fetch";

// import { useFetch } from "use-fetch"; // import { startServer, resetMocks, stopServer } from "../../utils/server"; //
import { getManyRequest, GetManyResponseType, interceptGetMany, interceptGetManyAlternative } from "../../utils/mocks";
// import { ErrorMockType } from "../../utils/server/server.constants"; // import { getCurrentState } from
"../../utils/utils"; // import { testFetchErrorState, testFetchInitialState, testFetchSuccessState } from
"../../shared/fetch.tests";

// const dump = getManyRequest.dump();

// let builder = new Builder<ErrorMockType>({ baseUrl: "" }); // let command =
builder.createCommand<GetManyResponseType>()(dump.commandOptions);

// const renderGetManyHook = () => // renderHook(() => useFetch(command, { dependencyTracking: false, revalidateOnMount:
false }));

// describe("[Basic] UseFetch hook", () => { // beforeAll(() => { // startServer(); // });

// afterEach(() => { // resetMocks(); // });

// afterAll(() => { // stopServer(); // });

// beforeEach(async () => { // builder.clear(); // builder = new Builder<ErrorMockType>({ baseUrl: "" }); // command =
builder.createCommand<GetManyResponseType>()(dump.commandOptions); // });

// it("should not initialize in loading state", async () => { // interceptGetMany(200);

// const responseOne = await renderGetManyHook(); // const responseTwo = await renderGetManyHook();

// testFetchInitialState(responseOne); // testFetchInitialState(responseTwo);

// expect(getCurrentState(responseOne).loading).toBe(false); //
expect(getCurrentState(responseTwo).loading).toBe(false); // });

// it("should change state once data is fetched", async () => { // const mock = interceptGetMany(200); // const
responseOne = await renderGetManyHook(); // const responseTwo = await renderGetManyHook();

// await waitFor(() => { // expect(getCurrentState(responseOne).data).not.toBe(null); // });

// testFetchSuccessState(mock, responseOne); // testFetchSuccessState(mock, responseTwo); // });

// it("should update error state once api call fails", async () => { // const mock = interceptGetMany(400); // const
responseOne = await renderGetManyHook(); // const responseTwo = await renderGetManyHook();

// await responseOne.waitForValueToChange(() => { // return !!getCurrentState(responseOne).error &&
!!getCurrentState(responseTwo).error; // });

// testFetchErrorState(mock, responseOne); // testFetchErrorState(mock, responseTwo); // });

// it("should fetch new data once refresh method gets triggered", async () => { // const mock = interceptGetMany(200);
// const responseOne = await renderGetManyHook(); // const responseTwo = await renderGetManyHook();

// testFetchInitialState(responseOne); // testFetchInitialState(responseTwo);

// await responseOne.waitForValueToChange(() => { // return getCurrentState(responseOne).data &&
getCurrentState(responseTwo).data; // });

// testFetchSuccessState(mock, responseOne); // testFetchSuccessState(mock, responseTwo);

// const newMock = interceptGetManyAlternative(200);

// act(() => { // responseOne.result.current.revalidate(); // });

// await responseOne.waitFor(() => { // testFetchSuccessState(newMock, responseOne); // testFetchSuccessState(newMock,
responseTwo); // }); // });

// // // Write smaller tests // // it("should allow to use reducer actions to override the state, and emit it to other
hooks", async () => { // // const mock = interceptGetMany(200, 0); // // const responseOne = await renderGetManyHook();
// // const responseTwo = await renderGetManyHook();

// // testFetchInitialState(responseOne); // // testFetchInitialState(responseTwo);

// // await responseOne.waitForValueToChange(() => { // // return getCurrentState(responseOne).data &&
getCurrentState(responseTwo).data; // // });

// // const successStateOne = getCurrentState(responseOne);

// // testFetchSuccessState(mock, responseOne); // // testFetchSuccessState(mock, responseTwo);

// // const customLoading = true; // // const customData: typeof mock = [{ name: "Albert", age: 999 }]; // // const
customStatus = 666; // // const customError: ErrorMockType = { message: "custom error" };

// // await act(async () => { // // await successStateOne.actions.setLoading(customLoading); // // }); // // const
loadingStateOne = getCurrentState(responseOne); // // const loadingStateTwo = getCurrentState(responseTwo); // // await
waitFor(() => { // // expect(loadingStateOne.loading).toBe(customLoading); // //
expect(loadingStateTwo.loading).toBe(customLoading); // // });

// // await act(async () => { // // await successStateOne.actions.setData(customData); // // }); // // const
dataStateOne = getCurrentState(responseOne); // // const dataStateTwo = getCurrentState(responseTwo); // // await
waitFor(() => { // // expect(dataStateOne.data).toEqual(customData); // //
expect(dataStateTwo.data).toEqual(customData); // // });

// // await act(async () => { // // await successStateOne.actions.setStatus(customStatus); // // }); // // const
statusStateOne = getCurrentState(responseOne); // // const statusStateTwo = getCurrentState(responseTwo); // // await
waitFor(() => { // // expect(statusStateOne.status).toBe(customStatus); // //
expect(statusStateTwo.status).toBe(customStatus); // // });

// // await act(async () => { // // await sleep(400); // // await successStateOne.actions.setError(customError); // //
});

// // const errorStateOne = getCurrentState(responseOne); // // const errorStateTwo = getCurrentState(responseTwo);

// // await waitFor(() => { // // expect(errorStateOne.error).toBe(customError); // //
expect(errorStateTwo.error).toBe(customError); // // }); // // });

// // // Write smaller tests // // it("should allow to use reducer actions to override only the local state and not
affect related hooks", async () => { // // const mock = interceptGetMany(200, 0); // // const responseOne = await
renderGetManyHook(); // // const responseTwo = await renderGetManyHook();

// // testFetchInitialState(responseOne); // // testFetchInitialState(responseTwo);

// // await responseOne.waitForValueToChange(() => { // // return getCurrentState(responseOne).data &&
getCurrentState(responseTwo).data; // // });

// // const successStateOne = getCurrentState(responseOne); // // const successStateTwo = getCurrentState(responseTwo);

// // testFetchSuccessState(mock, responseOne); // // testFetchSuccessState(mock, responseTwo);

// // const customLoading = true; // // const customData: typeof mock = [{ name: "Albert", age: 999 }]; // // const
customStatus = 666; // // const customError: ErrorMockType = { message: "custom error" };

// // await act(async () => { // // await successStateOne.actions.setLoading(customLoading, false); // // }); // //
const loadingStateOne = getCurrentState(responseOne); // // const loadingStateTwo = getCurrentState(responseTwo); // //
await waitFor(() => { // // expect(loadingStateOne.loading).toBe(customLoading); // //
expect(loadingStateTwo.loading).toBe(successStateTwo.loading); // // });

// // await act(async () => { // // await successStateOne.actions.setData(customData, false); // // }); // // const
dataStateOne = getCurrentState(responseOne); // // const dataStateTwo = getCurrentState(responseTwo); // // await
waitFor(() => { // // expect(dataStateOne.data).toBe(customData); // //
expect(dataStateTwo.data).toBe(successStateTwo.data); // // });

// // await act(async () => { // // await successStateOne.actions.setStatus(customStatus, false); // // }); // // const
statusStateOne = getCurrentState(responseOne); // // const statusStateTwo = getCurrentState(responseTwo); // // await
waitFor(() => { // // expect(statusStateOne.status).toBe(customStatus); // //
expect(statusStateTwo.status).toBe(successStateTwo.status); // // });

// // await act(async () => { // // await successStateOne.actions.setError(customError, false); // // }); // // const
errorStateOne = getCurrentState(responseOne); // // const errorStateTwo = getCurrentState(responseTwo); // // await
waitFor(() => { // // expect(errorStateOne.error).toBe(customError); // //
expect(errorStateTwo.error).toBe(successStateTwo.error); // // }); // // }); // });
