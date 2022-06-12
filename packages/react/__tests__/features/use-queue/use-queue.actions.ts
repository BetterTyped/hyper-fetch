import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useQueue [ Actions ]", () => {
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
  });

  describe("given queue is running", () => {
    describe("when stop gets triggered", () => {
      it("should cancel ongoing requests", async () => {});
      it("should change stopped value", async () => {});
    });
    describe("when pause gets triggered", () => {
      it("should finish ongoing requests", async () => {});
      it("should change stopped value", async () => {});
    });
    describe("when stopping request", () => {
      it("should cancel request and mark it as stopped", async () => {});
      it("should take another requests and trigger them", async () => {});
    });
  });

  describe("given queue is stopped", () => {
    describe("when start gets triggered", () => {
      it("should send all queued requests", async () => {});
      it("should not send stopped requests", async () => {});
    });
    describe("when starting request", () => {
      it("should not send a request", async () => {});
    });
  });
});
