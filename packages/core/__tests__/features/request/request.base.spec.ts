import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Client, QueryParamsType } from "../../../src";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Fetch Adapter [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "/shared-endpoint" });
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "/shared-endpoint" });
    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should allow for setting custom header", async () => {
    // The queue should receive request with the appropriate header
    const spy = jest.fn(client.fetchDispatcher.add);
    jest.spyOn(client.fetchDispatcher, "add").mockImplementation(spy);
    const header = { it: "works" };
    const c = request.setHeaders(header);
    mockRequest(request);

    await c.send({});

    expect(c.headers).toEqual(header);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].headers).toEqual(header);
  });

  it("should allow for setting auth", async () => {
    // The queue should receive request with the appropriate header
    const spy = jest.fn(client.fetchDispatcher.add);
    jest.spyOn(client.fetchDispatcher, "add").mockImplementation(spy);
    mockRequest(request);

    expect(request.auth).toBe(true);

    const c = request.setAuth(false);

    await c.send({});

    expect(c.auth).toBe(false);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].auth).toBe(false);
  });

  it("should allow for setting custom params", async () => {
    // The queue should receive request with the appropriate header
    const comm = client.createRequest<{ queryParams: QueryParamsType }>()({
      endpoint: "/some-endpoint/:shopId/:productId",
    });
    const spy = jest.fn(client.fetchDispatcher.add);
    jest.spyOn(client.fetchDispatcher, "add").mockImplementation(spy);
    const params = { shopId: 11, productId: 1 };

    const c = comm.setParams(params);
    mockRequest(c);

    await c.send({
      queryParams: {},
    });

    expect(c.params).toEqual(params);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].params).toEqual(params);
  });

  it("should allow for setting data to the request", async () => {
    const spy = jest.fn(client.fetchDispatcher.add);
    jest.spyOn(client.fetchDispatcher, "add").mockImplementation(spy);
    const data = {
      userId: 11,
      role: "ADMIN",
    };
    const req = client.createRequest<{ response: void; payload: { userId: number; role: string } }>()({
      endpoint: "/shared-endpoint",
    });

    const c = req.setPayload(data);
    mockRequest(c);

    await c.send({});

    expect(c.payload).toStrictEqual(data);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].payload).toEqual(data);
  });

  it("Should allow for setting queryParams", async () => {
    const queryParams = { userId: 11 };
    const comm = client.createRequest<{ queryParams: QueryParamsType }>()({
      endpoint: "/some-endpoint/",
    });
    mockRequest(comm);
    const spy = jest.fn(client.fetchDispatcher.add);
    jest.spyOn(client.fetchDispatcher, "add").mockImplementation(spy);

    const requestQueryParams = comm.setQueryParams(queryParams);
    requestQueryParams.send({});

    expect(requestQueryParams.queryParams).toStrictEqual(queryParams);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].queryParams).toStrictEqual(queryParams);
  });

  it("Should allow to validate before sending request", async () => {
    const message = "something went wrong";
    const mapper = () => {
      throw new Error(message);
    };
    const mapperRequest = client
      .createRequest<{ response: null }>()({ endpoint: "/some-endpoint/" })
      .setRequestMapper(mapper);
    mockRequest(mapperRequest);

    const { data, error } = await mapperRequest.send({});

    expect(error?.message).toStrictEqual(message);
    expect(data).toBe(null);
  });

  it("Should allow to validate response", async () => {
    const message = "something went wrong";

    const mapperRequest = client
      .createRequest<{ response: null }>()({ endpoint: "/some-endpoint/" })
      .setResponseMapper((res) => {
        return { ...res, data: null, error: new Error(message) };
      });
    mockRequest(mapperRequest);

    const { data, error } = await mapperRequest.send({});

    expect(error?.message).toStrictEqual(message);
    expect(data).toBe(null);
  });

  it("Should allow to validate in data mapper", async () => {
    const message = "something went wrong";
    const mapper = () => {
      throw new Error(message);
    };
    const mapperRequest = client
      .createRequest<{ response: null }>()({ endpoint: "/some-endpoint/" })
      .setPayloadMapper(mapper);
    mockRequest(mapperRequest);

    const { data, error } = await mapperRequest.send({});

    expect(error?.message).toStrictEqual(message);
    expect(data).toBe(null);
  });

  describe("read()", () => {
    it("should return cached data when available", async () => {
      const cachedData = {
        data: { foo: "bar" },
        status: 200,
      };

      await request
        .setMock(() => ({
          data: { foo: "bar" } as any,
          status: 200,
        }))
        .send();

      const result = request.read();

      expect(result).toEqual({
        ...cachedData,
        error: null,
        extra: request.client.adapter.defaultExtra,
        success: true,
        requestTimestamp: expect.any(Number),
        responseTimestamp: expect.any(Number),
      });
    });

    it("should return undefined when no cached data exists", () => {
      // Ensure cache is empty
      client.cache.clear();

      const result = request.read();

      expect(result).toBeUndefined();
    });
  });
});
