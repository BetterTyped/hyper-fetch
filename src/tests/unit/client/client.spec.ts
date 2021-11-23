import { resetMocks, startServer, stopServer } from "tests/server";
import { getBase, interceptBase, getManyRequest, interceptGetMany } from "tests/mocks";
import { fetchClient } from "client";

describe("Basic XHR Client usage", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    const requestInstance = getManyRequest.clone();

    const mock = interceptGetMany(200);

    const [response, error, status] = await fetchClient(requestInstance);

    expect(response).toStrictEqual(mock);
    expect(status).toBe(200);
    expect(error).toBe(null);
  });

  it("should make a request and return error data with status", async () => {
    const requestInstance = getManyRequest.clone();

    const mock = interceptGetMany(400);

    const [response, error, status] = await fetchClient(requestInstance);

    expect(response).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual(mock);
  });

  it("should allow to cancel request and return error", async () => {
    const requestInstance = getBase.clone();

    interceptBase(200, 500);

    const request = fetchClient(requestInstance);

    requestInstance.abortController.abort();

    const [response, error, status] = await request;

    expect(response).toBe(null);
    expect(status).toBe(0);
    expect(error?.message).toBe("Request cancelled");
  });
});
