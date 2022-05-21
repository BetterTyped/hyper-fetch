import { renderHook } from "@testing-library/react";

import { useFetch } from "use-fetch";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand, waitForRender } from "../../utils";
import { testSuccessState } from "../../shared";

describe("useFetch [ Basic ]", () => {
  let command = createCommand();

  const renderUseFetch = () =>
    renderHook(() => useFetch(command, { dependencyTracking: false, revalidateOnMount: false }));

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(async () => {
    builder.clear();
    command = createCommand();
  });

  it("should change state once data is fetched", async () => {
    const mock = createRequestInterceptor(command);

    const renderOne = renderUseFetch();
    const renderTwo = renderUseFetch();

    await waitForRender();

    const responseOne = renderOne;
    const responseTwo = renderTwo;

    testSuccessState(mock, responseOne);
    testSuccessState(mock, responseTwo);
  });
});
