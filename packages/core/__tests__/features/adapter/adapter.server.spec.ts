/**
 * @jest-environment node
 */
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { getErrorMessage } from "adapter";
import { Client } from "client";
import { HttpAdapter } from "http-adapter";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Http Adapter [ Fetch ]", () => {
  const requestId = "test";
  const abortKey = "abort-key";

  let client = new Client({ url: "http://shared-base-url" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint", abortKey });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "http://shared-base-url" });
    client.appManager.isBrowser = false;

    request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint", abortKey });

    client.requestManager.addAbortController(abortKey, requestId);

    resetMocks();
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should pick correct adapter and not throw", async () => {
    mockRequest(request);
    client.appManager.isBrowser = true;
    await expect(() => HttpAdapter().initialize(client).fetch(request, requestId)).not.toThrow();
  });

  it("should make a request and return success data with status", async () => {
    const data = mockRequest(request, { data: { response: [] } });

    const { data: response, error, status, extra } = await HttpAdapter().initialize(client).fetch(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toEqual({ headers: { "content-type": "application/json", "content-length": "15" } });
  });

  it("should make a request and return error data with status", async () => {
    const data = mockRequest(request, { status: 400 });

    const { data: response, error, status, extra } = await HttpAdapter().initialize(client).fetch(request, requestId);

    expect(response).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual(data);
    expect(extra).toEqual({ headers: { "content-type": "application/json", "content-length": "19" } });
  });

  it("should allow to cancel request and return error", async () => {
    mockRequest(request, { delay: 5 });

    const id = setTimeout(() => {
      request.abort();
    }, 2);

    const { data: response, error } = await HttpAdapter().initialize(client).fetch(request, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("abort").message);

    clearTimeout(id);
  });

  it("should return timeout error when request takes too long", async () => {
    const timeoutRequest = request.setOptions({ timeout: 10 });
    mockRequest(timeoutRequest, { delay: 20 });

    const { data: response, error } = await HttpAdapter().initialize(client).fetch(timeoutRequest, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("timeout").message);
  });

  it("should allow to make post request with json data", async () => {
    const payload = {
      testData: "123",
    };
    const postRequest = client
      .createRequest<{
        response: null;
        payload: { testData: string };
      }>()({ endpoint: "shared-endpoint", method: "POST" })
      .setPayload(payload);
    client.requestManager.addAbortController(postRequest.abortKey, requestId);
    const mock = mockRequest(postRequest);

    const {
      data: response,
      error,
      status,
      extra,
    } = await HttpAdapter().initialize(client).fetch(postRequest, requestId);

    expect(response).toEqual(mock);
    expect(error).toBeNull();
    expect(status).toEqual(200);
    expect(extra).toEqual({ headers: { "content-type": "application/json", "content-length": "2" } });
  });

  it("should send payload with object data", async () => {
    const mutation = client.createRequest<{ response: any; payload: any }>()({
      endpoint: "/shared-endpoint",
      method: "POST",
    });
    client.requestManager.addAbortController(mutation.abortKey, requestId);
    mockRequest(mutation);

    const { error, status } = await mutation.send({
      payload: {
        username: "Kacper",
        password: "Kacper1234",
      },
    });

    expect(error).toBeNull();
    expect(status).toBe(200);
  });

  it("should send payload with string data", async () => {
    const mutation = client.createRequest<{ response: any; payload: any }>()({
      endpoint: "/shared-endpoint",
      method: "POST",
    });
    client.requestManager.addAbortController(mutation.abortKey, requestId);
    mockRequest(mutation);

    const { error, status } = await mutation.send({
      payload: "raw-string-payload",
    });

    expect(error).toBeNull();
    expect(status).toBe(200);
  });
});
