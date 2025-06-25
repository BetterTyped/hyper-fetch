import { createHttpMockingServer } from "@hyper-fetch/testing";

import { client } from "../../utils";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("useFetch [ Suspense ]", () => {
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
  });

  it("should render fallback", async () => {
    // TODO
  });
  it("should render multiple fallbacks", async () => {
    // TODO
  });
  it("should throw errors", async () => {
    // TODO
  });
  it("should render cached data with error", async () => {
    // TODO
  });
});
