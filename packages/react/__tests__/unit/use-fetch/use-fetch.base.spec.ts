import { renderHook } from "@testing-library/react-hooks/dom";

import { useFetch } from "use-fetch";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand } from "../../utils";
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
    const responseOne = await renderUseFetch();
    const responseTwo = await renderUseFetch();

    testSuccessState(mock, responseOne);
    testSuccessState(mock, responseTwo);
  });
});
