/**
 * @jest-environment jsdom
 */
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { getErrorMessage } from "adapter";
import { Client } from "client";
import { HttpAdapter } from "http-adapter";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Http Adapter [ Browser ]", () => {
  const requestId = "test";

  let client = new Client({ url: "https://shared-base-url" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "https://shared-base-url" });
    request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint" });

    request.client.requestManager.addAbortController(request.abortKey, requestId);
    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    const data = mockRequest(request, { data: { response: [] } });

    const { data: response, error, status, extra } = await HttpAdapter().initialize(client).fetch(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "content-length": "15" } });
  });

  it("should make a request and return error data with status", async () => {
    const data = mockRequest(request, { status: 400 });

    const { data: response, error, status, extra } = await HttpAdapter().initialize(client).fetch(request, requestId);

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

    const { data: response, error } = await HttpAdapter().initialize(client).fetch(request, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("abort").message);
  });

  it("should return timeout error when request takes too long", async () => {
    const timeoutRequest = request.setOptions({ timeout: 5 });
    mockRequest(timeoutRequest, { delay: 20 });

    const { data: response, error } = await HttpAdapter().initialize(client).fetch(timeoutRequest, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("timeout").message);
  });

  it("should use GET as default method when no method is specified", async () => {
    const mockSpy = jest.spyOn(XMLHttpRequest.prototype, "open");
    const data = mockRequest(request, { data: { response: [] } });

    const { data: response } = await HttpAdapter().initialize(client).fetch(request, requestId);

    expect(mockSpy).toHaveBeenCalledWith("GET", "https://shared-base-url/shared-endpoint", true);
    expect(response).toStrictEqual(data);
  });

  // it("should not throw when XMLHttpRequest is not available on window", async () => {
  //   const data = mockRequest(request, { delay: 20 });
  //   const xml = window.XMLHttpRequest;
  //   window.XMLHttpRequest = undefined as any;

  //   const { data: response, error, status, extra } = await HttpAdapter().initialize(client).fetch(request, requestId);

  //   expect(response).toStrictEqual(data);
  //   expect(status).toBe(200);
  //   expect(error).toBe(null);
  //   expect(extra).toEqual({ headers: { "content-type": "application/json", "content-length": "2" } });
  //   window.XMLHttpRequest = xml;
  // });
});
