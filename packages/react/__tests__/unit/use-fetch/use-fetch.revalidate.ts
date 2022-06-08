import { startServer, resetInterceptors, stopServer } from "../../server";
import { builder } from "../../utils";

describe("useFetch [ Revalidate ]", () => {
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
    await builder.clear();
  });

  it("should allow to prevent revalidation on mount", async () => {
    // Todo
  });
  it("should allow to revalidate on mount", async () => {
    // Todo
  });
  it("should allow to revalidate current hook", async () => {
    // Todo
  });
  it("should allow to revalidate hook by RegExp", async () => {
    // Todo
  });
  it("should allow to revalidate hook by key", async () => {
    // Todo
  });
});
