import { adapter, getErrorMessage } from "adapter";
import { resetInterceptors, startServer, stopServer, createRequestInterceptor } from "../../server";
import { createClient, createRequest } from "../../utils";

describe("Fetch Adapter [ Browser ]", () => {
  const requestId = "test";

  let client = createClient();
  let request = createRequest(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient();
    request = createRequest(client);
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    const data = createRequestInterceptor(request, { fixture: { data: [] } });

    const [response, error, status] = await adapter(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
  });

  it("should make a request and return error data with status", async () => {
    const data = createRequestInterceptor(request, { status: 400 });

    const [response, error, status] = await adapter(request, requestId);

    expect(response).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual(data);
  });

  it("should allow to cancel request and return error", async () => {
    createRequestInterceptor(request, { delay: 5 });

    setTimeout(() => {
      request.abort();
    }, 2);

    const [response, error] = await adapter(request, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("abort").message);
  });

  it("should return timeout error when request takes too long", async () => {
    const timeoutRequest = createRequest(client, { options: { timeout: 10 } });
    createRequestInterceptor(timeoutRequest, { delay: 20 });

    const [response, error] = await adapter(timeoutRequest, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("timeout").message);
  });

  it("should not throw when XMLHttpRequest is not available on window", async () => {
    const data = createRequestInterceptor(request, { delay: 20 });
    const xml = window.XMLHttpRequest;
    window.XMLHttpRequest = undefined as any;

    const [response, error, status] = await adapter(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    window.XMLHttpRequest = xml;
  });
});
