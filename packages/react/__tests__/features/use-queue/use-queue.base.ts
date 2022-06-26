import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand, renderUseSubmit } from "../../utils";

describe("useQueue [ Base ]", () => {
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

  describe("given hook is mounting", () => {
    describe("when queue is processing requests", () => {
      it("should initialize with all processed requests", async () => {
        const mock = createRequestInterceptor(command);
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.submit();
        });

        await testSuccessState(mock, response);
      });
    });
  });
  describe("given queue is empty", () => {
    describe("when command is added to queue", () => {
      it("should update the requests values", async () => {});
      it("should update upload progress of requests", async () => {});
      it("should update download progress of requests", async () => {});
    });
  });
});
