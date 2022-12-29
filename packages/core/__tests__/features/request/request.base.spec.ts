import { createClient, createRequest } from "../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";
import { QueryParamsType } from "../../../src";

describe("Fetch Adapter [ Base ]", () => {
  let client = createClient();
  let request = createRequest(client);
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient();
    request = createRequest(client);
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
    const comm = client.createRequest<unknown, unknown, any, QueryParamsType>()({
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
    const c = request.setData(data);
    createRequestInterceptor(c);

    await c.send();

    expect(c.data).toStrictEqual(data);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].data).toEqual(data);
  });

  it("should allow for setting data mapper", async () => {
    const comm = createRequest<typeof client, Record<string, unknown>, { userId: number; role: string }>(client);
    const spy = jest.fn(client.fetchDispatcher.add);
    jest.spyOn(client.fetchDispatcher, "add").mockImplementation(spy);
    const data = {
      userId: 11,
      role: "ADMIN",
    };
    createRequestInterceptor(comm);
    function dataMapper({ role, userId }: { role: string; userId: number }): string {
      return `${userId}_${role}`;
    }

    const requestMapped = comm.setDataMapper(dataMapper);
    const requestSetData = requestMapped.setData(data);

    await requestSetData.send();

    expect(requestSetData.data).toStrictEqual(`${data.userId}_${data.role}`);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].data).toStrictEqual(`${data.userId}_${data.role}`);
  });

  it("Should allow for setting queryParams", async () => {
    const queryParams = { userId: 11 };
    const comm = client.createRequest<unknown, unknown, any, QueryParamsType>()({
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
});
