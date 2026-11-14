/**
 * @vitest-environment jsdom
 */
import { createHttpMockingServer } from "@hyper-fetch/testing";
import type { QueryParamsType } from "adapter";
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
    vi.resetAllMocks();
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

  it("should build the request url from the adapter-mapped query params", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    client.adapter.setQueryParamsMapperConfig({ arrayFormat: "comma" });
    const queryRequest = client
      .createRequest<{ response: any; queryParams: QueryParamsType }>()({ endpoint: "/shared-endpoint" })
      .setQueryParams({ tags: ["a b", "c&d"], q: "x&y=1", nil: null });
    mockRequest(queryRequest, { data: { response: [] } });

    const { status } = await client.adapter.fetch(queryRequest, requestId);

    expect(status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toBe(
      "https://shared-base-url/shared-endpoint?tags=a%20b,c%26d&q=x%26y%3D1",
    );
    fetchSpy.mockRestore();
  });

  it("should build the request url with a custom query params mapper", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    client.adapter.setQueryParamsMapper(() => "?custom=1");
    const queryRequest = client
      .createRequest<{ response: any; queryParams: QueryParamsType }>()({ endpoint: "/shared-endpoint" })
      .setQueryParams({ ignored: true });
    mockRequest(queryRequest, { data: { response: [] } });

    await client.adapter.fetch(queryRequest, requestId);

    expect(String(fetchSpy.mock.calls[0][0])).toBe("https://shared-base-url/shared-endpoint?custom=1");
    fetchSpy.mockRestore();
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

  it("should use GET as default method and return data", async () => {
    const data = mockRequest(request, { data: { response: [] } });

    const { data: response, status } = await HttpAdapter().initialize(client).fetch(request, requestId);

    expect(response).toStrictEqual(data);
    expect(status).toBe(200);
  });
});
