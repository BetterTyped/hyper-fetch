import { Client, getErrorMessage } from "@hyper-fetch/core";

import { createHttpMockingServer } from "../../src/http";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

describe("Http Mocking [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: any; payload: any }>()({ endpoint: "/shared-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(async () => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: any; payload: any }>()({ endpoint: "/shared-endpoint" });

    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should mock the request", async () => {
    const expected = mockRequest(request, { data: [1, 2, 3] });
    const { data, status, error, extra } = await request.send();

    expect(data).toStrictEqual(expected);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra?.headers).toStrictEqual({ "content-length": "7", "content-type": "application/json" });
  });

  it("should mock the error ", async () => {
    const expected = mockRequest(request, { status: 400, error: { message: "Some Error" } as Error });
    const { data, status, error, extra } = await request.send();

    expect(data).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual(expected);
    expect(extra?.headers).toStrictEqual({ "content-length": "24", "content-type": "application/json" });
  });

  it("should mock the timeout of request", async () => {
    mockRequest(request.setOptions({ timeout: 0 }), { delay: 100 });
    const { data, status, error, extra } = await request.send();

    expect(data).toBeNull();
    expect(status).toBe(500);
    expect(error?.message).toBe(getErrorMessage("timeout").message);
    expect(extra?.headers).toStrictEqual({
      "content-length": "29",
      "content-type": "application/json",
    });
  });

  it("should mock the adapter abort of request", async () => {
    mockRequest(request, { delay: 100 });
    const requestPromise = request.send();

    client.requestManager.abortAll();

    const { data, status, error, extra } = await requestPromise;

    expect(data).toBeNull();
    expect(status).toBe(0);
    expect(error?.message).toBe(getErrorMessage("abort").message);
    expect(extra?.headers).toStrictEqual({});
  });
});
