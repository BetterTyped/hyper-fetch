import { act } from "@testing-library/react";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testSuccessState } from "../../shared";
import { builder, createCommand, renderUseSubmit, waitForRender } from "../../utils";

describe("useSubmit [ Concurrency ]", () => {
  let command = createCommand({ method: "POST" });

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
    command = createCommand({ method: "POST" });
  });

  describe("given multiple rendered hooks", () => {
    describe("when used commands are equal", () => {
      it("should share data between hooks", async () => {
        const mock = createRequestInterceptor(command);
        const responseOne = renderUseSubmit(command);
        const responseTwo = renderUseSubmit(command);

        act(() => {
          responseOne.result.current.submit();
        });

        await testSuccessState(mock, responseOne);
        await testSuccessState(mock, responseTwo);
      });
      it("should start in loading mode when another request is ongoing", async () => {
        createRequestInterceptor(command);
        const responseOne = renderUseSubmit(command);

        act(() => {
          responseOne.result.current.submit();
        });

        await waitForRender();

        const responseTwo = renderUseSubmit(command);
        expect(responseTwo.result.current.submitting).toBeTrue();
      });
    });
  });
});
