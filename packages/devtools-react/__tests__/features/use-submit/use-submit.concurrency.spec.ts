import { act } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testSuccessState } from "../../shared";
import { client, createRequest, renderUseSubmit, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Concurrency ]", () => {
  let request = createRequest<null, null>({ method: "POST" });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    client.clear();
    request = createRequest({ method: "POST" });
  });

  describe("given multiple rendered hooks", () => {
    describe("when used requests are equal", () => {
      it("should share data between hooks", async () => {
        const mock = mockRequest(request);
        const responseOne = renderUseSubmit(request);
        const responseTwo = renderUseSubmit(request);

        act(() => {
          responseOne.result.current.submit();
        });

        await testSuccessState(mock, responseOne);
        await testSuccessState(mock, responseTwo);
      });
      it("should start in loading mode when another request is ongoing", async () => {
        mockRequest(request);
        const responseOne = renderUseSubmit(request);

        act(() => {
          responseOne.result.current.submit();
        });

        await waitForRender();

        const responseTwo = renderUseSubmit(request);
        expect(responseTwo.result.current.submitting).toBeTrue();
      });
    });
  });
});
