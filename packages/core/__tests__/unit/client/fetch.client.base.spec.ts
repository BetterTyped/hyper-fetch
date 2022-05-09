import { fetchClient, getErrorMessage } from "client";
import { resetInterceptors, startServer, stopServer, createRequestInterceptor } from "../../server";
import { createBuilder, createCommand } from "../../utils";

describe("Fetch Client [ Base ]", () => {
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

  it("should make a request and return error data with status", async () => {
    const data = createRequestInterceptor(command, { status: 400 });

    const [response, error, status] = await fetchClient(command, requestId);

    expect(response).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual(data);
  });

  it("should allow to cancel request and return error", async () => {
    createRequestInterceptor(command, { delay: 5 });

    setTimeout(() => {
      command.abort();
    }, 2);

    const [response, error] = await fetchClient(command, requestId);

    expect(response).toBe(null);
    expect(error).toEqual(getErrorMessage("abort"));
  });

  it("should return timeout error when request takes too long", async () => {
    const timeoutCommand = createCommand(builder, { options: { timeout: 10 } });
    createRequestInterceptor(timeoutCommand, { delay: 20 });

    const [response, error] = await fetchClient(timeoutCommand, requestId);

    expect(response).toBe(null);
    expect(error).toEqual(getErrorMessage("timeout"));
  });
});
