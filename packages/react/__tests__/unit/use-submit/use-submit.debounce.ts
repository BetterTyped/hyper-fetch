import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useSubmit [ Debounce ]", () => {
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

  describe("given debounce is active", () => {
    describe("when command is about to change", () => {
      it("should not debounce initial request", async () => {});
      it("should debounce multiple request triggers by 100ms", async () => {});
    });
  });

  describe("given debounce is off", () => {
    describe("when command is about to change", () => {
      it("should not debounce multiple request triggers", async () => {});
    });
  });
});
