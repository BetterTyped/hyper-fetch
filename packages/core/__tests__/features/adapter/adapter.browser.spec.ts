/**
 * @jest-environment jsdom
 */
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { adapter, getErrorMessage } from "adapter";
import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Fetch Adapter [ Browser ]", () => {
  const requestId = "test";

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<any>()({ endpoint: "/shared-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "/shared-endpoint" });

    request.client.requestManager.addAbortController(request.abortKey, requestId);
    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    const data = mockRequest(request, { data: { response: [] } });

    const { data: response, error, status, extra } = await adapter(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
  });

  it("should make a request and return error data with status", async () => {
    const data = mockRequest(request, { status: 400 });

    const { data: response, error, status, extra } = await adapter(request, requestId);

    expect(response).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual(data);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
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
    const timeoutRequest = request.setOptions({ timeout: 5 });
    mockRequest(timeoutRequest, { delay: 20 });

    const { data: response, error } = await adapter(timeoutRequest, requestId);

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("timeout").message);
  });

  it("should not throw when XMLHttpRequest is not available on window", async () => {
    const data = mockRequest(request, { delay: 20 });
    const xml = window.XMLHttpRequest;
    window.XMLHttpRequest = undefined as any;

    const { data: response, error, status, extra } = await adapter(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
    window.XMLHttpRequest = xml;
  });

  it("should allow to set options", async () => {
    const xml = window.XMLHttpRequest;
    let instance: null | XMLHttpRequest = null;
    class ExtendedXml extends XMLHttpRequest {
      constructor() {
        super();
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        instance = this;
      }
    }

    window.XMLHttpRequest = ExtendedXml;

    const timeoutRequest = request.setOptions({ timeout: 50 });
    mockRequest(timeoutRequest, { delay: 20 });
    await adapter(timeoutRequest, requestId);
    expect(instance.timeout).toBe(50);

    window.XMLHttpRequest = xml;
  });
});
