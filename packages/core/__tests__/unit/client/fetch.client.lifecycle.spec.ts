import { fetchClient } from "client";
import { resetInterceptors, startServer, stopServer, createRequestInterceptor } from "../../server";
import { createBuilder, createCommand } from "../../utils";

describe("Fetch Client [ Lifecycle ]", () => {
  const requestId = "test";

  let builder = createBuilder();
  let command = createCommand(builder);

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    builder = createBuilder();
    command = createCommand(builder);
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    const data = createRequestInterceptor(command, { fixture: { data: [] } });

    const [response, error, status] = await fetchClient(command, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
  });
});
