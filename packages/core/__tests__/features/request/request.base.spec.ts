import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";
import { Client, QueryParamsType } from "../../../src";

describe("Fetch Adapter [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "/shared-endpoint" });
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "/shared-endpoint" });
    resetInterceptors();
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
    createRequestInterceptor(request);

    await c.send();

    expect(c.headers).toEqual(header);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].headers).toEqual(header);
  });

  it("should allow for setting auth", async () => {
    // The queue should receive request with the appropriate header
    const spy = jest.fn(client.fetchDispatcher.add);
    jest.spyOn(client.fetchDispatcher, "add").mockImplementation(spy);
    createRequestInterceptor(request);

    expect(request.auth).toBe(true);

    const c = request.setAuth(false);

    await c.send();

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
    createRequestInterceptor(c);

    await c.send();

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
    const req = client.createRequest<{ payload: { userId: number; role: string } }>()({ endpoint: "/shared-endpoint" });

    const c = req.setData(data);
    createRequestInterceptor(c);

    await c.send();

    expect(c.data).toStrictEqual(data);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].data).toEqual(data);
  });

  it("Should allow for setting queryParams", async () => {
    const queryParams = { userId: 11 };
    const comm = client.createRequest<{ queryParams: QueryParamsType }>()({
      endpoint: "/some-endpoint/",
    });
    createRequestInterceptor(comm);
    const spy = jest.fn(client.fetchDispatcher.add);
    jest.spyOn(client.fetchDispatcher, "add").mockImplementation(spy);

    const requestQueryParams = comm.setQueryParams(queryParams);
    requestQueryParams.send();

    expect(requestQueryParams.queryParams).toStrictEqual(queryParams);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].queryParams).toStrictEqual(queryParams);
  });

  it("Should allow to validate before sending request", async () => {
    const message = "something went wrong";
    const mapper = () => {
      throw new Error(message);
    };
    const mapperRequest = client.createRequest<null>()({ endpoint: "/some-endpoint/" }).setRequestMapper(mapper);
    createRequestInterceptor(mapperRequest);

    const { data, error } = await mapperRequest.send();

    expect(error.message).toStrictEqual(message);
    expect(data).toBe(null);
  });

  it("Should allow to validate response", async () => {
    const message = "something went wrong";
    const mapper = (res) => {
      return { ...res, data: null, error: new Error(message) };
    };
    const mapperRequest = client.createRequest<null>()({ endpoint: "/some-endpoint/" }).setResponseMapper(mapper);
    createRequestInterceptor(mapperRequest);

    const { data, error } = await mapperRequest.send();

    expect(error.message).toStrictEqual(message);
    expect(data).toBe(null);
  });

  it("Should allow to validate in data mapper", async () => {
    const message = "something went wrong";
    const mapper = () => {
      throw new Error(message);
    };
    const mapperRequest = client.createRequest<null>()({ endpoint: "/some-endpoint/" }).setDataMapper(mapper);
    createRequestInterceptor(mapperRequest);

    const { data, error } = await mapperRequest.send();

    expect(error.message).toStrictEqual(message);
    expect(data).toBe(null);
  });
});
