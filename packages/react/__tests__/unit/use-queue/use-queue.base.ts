import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useQueue [ Base ]", () => {
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
    jest.resetModules();
  });

  describe("given hook is mounting", () => {
    describe("when queue is processing requests", () => {
      it("should initialize with all processed requests", async () => {});
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
