import { act } from "@testing-library/react";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testErrorState, testSuccessState } from "../../shared";
import { builder, createCommand, renderUseFetch, renderUseSubmit } from "../../utils";

describe("useFetch [ Revalidate ]", () => {
  let commandSubmit = createCommand({ method: "POST" });
  let commandFetch = createCommand({ endpoint: "fetch-test" });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    builder.clear();
    commandSubmit = createCommand({ method: "POST" });
    commandFetch = createCommand({ endpoint: "fetch-test" });
  });

  it("should allow to revalidate other command on finished", async () => {
    const submitMock = createRequestInterceptor(commandSubmit);
    const errorFetchMock = createRequestInterceptor(commandFetch, { status: 400 });
    const responseSubmit = renderUseSubmit(commandSubmit);
    const responseFetch = renderUseFetch(commandFetch);

    await testErrorState(errorFetchMock, responseFetch);
    const fetchMock = createRequestInterceptor(commandFetch);

    act(() => {
      responseSubmit.result.current.onSubmitFinished(() => {
        responseSubmit.result.current.revalidate(commandFetch);
      });
      responseSubmit.result.current.submit();
    });

    await testSuccessState(submitMock, responseSubmit);
    await testSuccessState(fetchMock, responseFetch);
  });
});
