/**
 * @jest-environment node
 */
import http from "http";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { getErrorMessage } from "adapter";
import { Client } from "client";
import { httpAdapter } from "http-adapter";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Http Adapter [ Server ]", () => {
  const requestId = "test";
  const abortKey = "abort-key";
  const requestCopy = http.request;

  let client = new Client({ url: "http://shared-base-url" });
  let clientHttps = new Client({ url: "https://shared-base-url" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint", abortKey });
  let requestHttps = clientHttps.createRequest()({ endpoint: "/shared-endpoint", abortKey });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "http://shared-base-url" });
    clientHttps = new Client({ url: "https://shared-base-url" });
    client.appManager.isBrowser = false;
    clientHttps.appManager.isBrowser = false;

    request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint", abortKey });
    requestHttps = clientHttps.createRequest()({ endpoint: "/shared-endpoint", abortKey });

    client.requestManager.addAbortController(abortKey, requestId);
    clientHttps.requestManager.addAbortController(abortKey, requestId);

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
    await expect(() => httpAdapter.fetch(request, requestId)).not.toThrow();
  });

  it("should pick https module", async () => {
    mockRequest(requestHttps);
    await expect(() => httpAdapter.fetch(requestHttps, requestId)).not.toThrow();
  });

  it("should make a request and return success data with status", async () => {
    const data = mockRequest(request, { data: { response: [] } });

    const { data: response, error, status, extra } = await httpAdapter.fetch(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toEqual({ headers: { "content-type": "application/json", "content-length": "15" } });
  });

  it("should make a request and return error data with status", async () => {
    const data = mockRequest(request, { status: 400 });

    const { data: response, error, status, extra } = await httpAdapter.fetch(request, requestId);

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

    const { data: response, error } = await httpAdapter.fetch(request, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("abort").message);

    clearTimeout(id);
  });

  it("should return timeout error when request takes too long", async () => {
    const timeoutRequest = request.setOptions({ timeout: 10 });
    mockRequest(timeoutRequest, { delay: 20 });

    const { data: response, error } = await httpAdapter.fetch(timeoutRequest, requestId);

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

    const { data: response, error, status, extra } = await httpAdapter.fetch(postRequest, requestId);

    expect(response).toEqual(mock);
    expect(error).toBeNull();
    expect(status).toEqual(200);
    expect(extra).toEqual({ headers: { "content-type": "application/json", "content-length": "2" } });
  });

  it("should allow to calculate payload size", async () => {
    let receivedOptions: any;
    const mutation = client.createRequest<{ response: any; payload: any }>()({
      endpoint: "/shared-endpoint",
      method: "POST",
    });

    jest.spyOn(http, "request").mockImplementation((_, options, callback) => {
      receivedOptions = options;
      return requestCopy(options, callback);
    });
    mockRequest(mutation);

    await mutation.send({
      payload: {
        username: "Kacper",
        password: "Kacper1234",
      },
    });

    expect(receivedOptions.headers["Content-Length"]).toBeGreaterThan(0);
  });

  it("should allow to calculate Buffer size", async () => {
    let receivedOptions: any;
    const mutation = client.createRequest<{ response: any; payload: any }>()({
      endpoint: "/shared-endpoint",
      method: "POST",
    });

    jest.spyOn(http, "request").mockImplementation((_, options, callback) => {
      receivedOptions = options;
      return requestCopy(options, callback);
    });
    mockRequest(mutation);

    const buffer = Buffer.from("test");

    await mutation.send({
      payload: buffer as any,
    });

    expect(receivedOptions.headers["Content-Length"]).toBeGreaterThan(0);
  });
});
