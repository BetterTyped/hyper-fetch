import { fetchClient, getErrorMessage } from "client";
import { resetInterceptors, startServer, stopServer, createRequestInterceptor } from "../../server";
import { createBuilder, createCommand } from "../../utils";

describe("Fetch Client [ Server ]", () => {
  const requestId = "test";

  let builder = createBuilder();
  let command = createCommand(builder);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    builder = createBuilder();
    command = createCommand(builder);
    builder.appManager.isNodeJs = true;
    resetInterceptors();
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should pick correct client and not throw", async () => {
    createRequestInterceptor(command);
    builder.appManager.isNodeJs = false;
    jest.spyOn(global, "window", "get").mockImplementation(() => undefined);
    await expect(() => fetchClient(command, requestId)).not.toThrow();
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
    expect(error).toEqual({ message: getErrorMessage("timeout").message });
  });

  it("should allow to make post request with json data", async () => {
    const payload = {
      testData: "123",
    };
    const postCommand = createCommand(builder, { method: "POST" }).setData(payload);
    const mock = createRequestInterceptor(postCommand);

    const [response, error, status] = await fetchClient(postCommand, requestId);

    expect(response).toEqual(mock);
    expect(error).toBeNull();
    expect(status).toEqual(200);
  });

  it("should allow to make post request with FormData", async () => {
    const payload = new FormData();
    payload.append("file", new Blob(["test"], { type: "text/plain" }));

    const postCommand = createCommand(builder, { method: "POST" }).setData(payload);
    const mock = createRequestInterceptor(postCommand);

    const [response, error, status] = await fetchClient(postCommand, requestId);

    expect(response).toEqual(mock);
    expect(error).toBeNull();
    expect(status).toEqual(200);
  });
});
