import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useFetch [ Helpers ]", () => {
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

  describe("given hook is mounted", () => {
    describe("when processing request", () => {
      it("should trigger onRequestStart helper", async () => {});
      it("should trigger onResponseStart helper", async () => {});
      it("should trigger onDownloadProgress helper", async () => {});
      it("should trigger onUploadProgress helper", async () => {});
    });
    describe("when getting the response", () => {
      it("should trigger onSuccess helper", async () => {});
      it("should trigger onError helper", async () => {});
      it("should trigger onFinished helper", async () => {});
      it("should trigger onOfflineError helper", async () => {});
      it("should trigger onCancelError helper", async () => {});
    });
    describe("when getting internal error", () => {
      it("should trigger onOfflineError helper", async () => {});
      it("should trigger onTimeoutError helper", async () => {});
      it("should trigger onCancelError helper", async () => {});
    });
  });
});
