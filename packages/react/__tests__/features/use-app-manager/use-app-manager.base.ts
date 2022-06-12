import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useAppManager [ Base ]", () => {
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

  describe("given app is initializing", () => {
    describe("when async initialOnline is passed", () => {
      it("should initialize in offline mode", async () => {});
    });
    describe("when async initialOffline is passed", () => {
      it("should initialize in blur mode", async () => {});
    });
  });
  describe("given app online status change", () => {
    describe("when turning offline", () => {
      it("should change isOnline state to false", async () => {});
    });
    describe("when turning online", () => {
      it("should change isOnline state to true", async () => {});
    });
  });
  describe("given app focus status change", () => {
    describe("when turning blur", () => {
      it("should change isFocused state to false", async () => {});
    });
    describe("when turning focused", () => {
      it("should change isFocused state to true", async () => {});
    });
  });
});
