/**
 * @jest-environment node
 */
import http from "http";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { adapter } from "../../../src/adapter/adapter.server";
import { getErrorMessage } from "adapter";
import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Fetch Adapter [ Server ]", () => {
  const requestId = "test";
  const requestCopy = http.request;

  let client = new Client({ url: "shared-base-url" });
  let clientHttps = new Client({ url: "https://shared-base-url" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint" });
  let requestHttps = clientHttps.createRequest()({ endpoint: "/shared-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    clientHttps = new Client({ url: "https://shared-base-url" });
    request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint" });
    requestHttps = clientHttps.createRequest()({ endpoint: "/shared-endpoint" });

    client.requestManager.addAbortController(request.abortKey, requestId);
    client.appManager.isBrowser = false;
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
    await expect(() => adapter(request, requestId)).not.toThrow();
  });

  it("should pick https module", async () => {
    mockRequest(request);
    await expect(() => adapter(requestHttps, requestId)).not.toThrow();
  });

  it("should make a request and return success data with status", async () => {
    const data = mockRequest(request, { data: { response: [] } });

    const { data: response, error, status, extra } = await adapter(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "content-length": "15" } });
  });

  it("should make a request and return error data with status", async () => {
    const data = mockRequest(request, { status: 400 });

    const { data: response, error, status, extra } = await adapter(request, requestId);

    expect(response).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual(data);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "content-length": "19" } });
  });

  it("should allow to cancel request and return error", async () => {
    mockRequest(request, { delay: 5 });

    setTimeout(() => {
      request.abort();
    }, 2);

    const { data: response, error } = await adapter(request, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("abort").message);
  });

  it("should return timeout error when request takes too long", async () => {
    const timeoutRequest = request.setOptions({ timeout: 10 });
    mockRequest(timeoutRequest, { delay: 20 });

    const { data: response, error } = await adapter(timeoutRequest, requestId);

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

    const { data: response, error, status, extra } = await adapter(postRequest, requestId);

    expect(response).toEqual(mock);
    expect(error).toBeNull();
    expect(status).toEqual(200);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "content-length": "2" } });
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
