/**
 * @jest-environment node
 */
import { adapter } from "../../../src/adapter/adapter.server";
import { getErrorMessage } from "adapter";
import { resetInterceptors, startServer, stopServer, createRequestInterceptor } from "../../server";
import { Client } from "client";

describe("Fetch Adapter [ Server ]", () => {
  const requestId = "test";

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "/shared-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "/shared-endpoint" });

    client.requestManager.addAbortController(request.abortKey, requestId);
    client.appManager.isBrowser = false;
    resetInterceptors();
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should pick correct adapter and not throw", async () => {
    createRequestInterceptor(request);
    client.appManager.isBrowser = true;
    await expect(() => adapter(request, requestId)).not.toThrow();
  });

  it("should make a request and return success data with status", async () => {
    const data = createRequestInterceptor(request, { fixture: { data: [] } });

    const { data: response, error, status, additionalData } = await adapter(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(additionalData).toStrictEqual({});
  });

  it("should make a request and return error data with status", async () => {
    const data = createRequestInterceptor(request, { status: 400 });

    const { data: response, error, status, additionalData } = await adapter(request, requestId);

    expect(response).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual(data);
    expect(additionalData).toStrictEqual({});
  });

  it("should allow to cancel request and return error", async () => {
    createRequestInterceptor(request, { delay: 5 });

    setTimeout(() => {
      request.abort();
    }, 2);

    const { data: response, error } = await adapter(request, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("abort").message);
  });

  it("should return timeout error when request takes too long", async () => {
    const timeoutRequest = request.setOptions({ timeout: 10 });
    createRequestInterceptor(timeoutRequest, { delay: 20 });

    const { data: response, error } = await adapter(timeoutRequest, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("timeout").message);
  });

  it("should allow to make post request with json data", async () => {
    const payload = {
      testData: "123",
    };
    const postRequest = client
      .createRequest<unknown, { testData: string }>()({ endpoint: "shared-endpoint", method: "POST" })
      .setData(payload);
    client.requestManager.addAbortController(postRequest.abortKey, requestId);
    const mock = createRequestInterceptor(postRequest);

    const { data: response, error, status, additionalData } = await adapter(postRequest, requestId);

    expect(response).toEqual(mock);
    expect(error).toBeNull();
    expect(status).toEqual(200);
    expect(additionalData).toStrictEqual({});
  });
});
