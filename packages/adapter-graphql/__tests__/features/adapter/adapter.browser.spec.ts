/**
 * @jest-environment jsdom
 */
import { Client, getErrorMessage } from "@hyper-fetch/core";
import { createGraphqlMockingServer } from "@hyper-fetch/testing";

import { GraphqlAdapter } from "adapter";
import { GetUserQueryResponse, getUserQuery, getUserQueryString } from "../../constants/queries.constants";
import { LoginMutationVariables, loginMutation } from "../../constants/mutations.constants";

const { startServer, stopServer, resetMocks, mockRequest } = createGraphqlMockingServer();

describe("Graphql Adapter [ Browser ]", () => {
  let client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter);
  let request = client.createRequest<GetUserQueryResponse>()({ endpoint: getUserQuery });
  let mutation = client.createRequest<GetUserQueryResponse, LoginMutationVariables>()({
    endpoint: loginMutation,
  });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter);
    request = client.createRequest<GetUserQueryResponse>()({ endpoint: getUserQuery });
    mutation = client.createRequest<GetUserQueryResponse, LoginMutationVariables>()({
      endpoint: loginMutation,
    });

    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    const data = mockRequest(request, { data: { username: "prc", firstName: "Maciej" } });

    const { data: response, error, status, extra } = await request.send();

    expect(response).toStrictEqual({ data });
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
  });

  it("should make a request with string endpoint", async () => {
    const data = mockRequest(request, { data: { username: "prc", firstName: "Maciej" } });

    const {
      data: response,
      error,
      status,
      extra,
    } = await client.createRequest()({ endpoint: getUserQueryString }).send();

    expect(response).toStrictEqual({ data });
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
  });

  it("should make a request and return error data with status", async () => {
    const data = mockRequest(request, { status: 400 });

    const { data: response, error, status, extra } = await request.send();

    expect(response).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual({ errors: [data] });
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
  });

  it("should allow to make mutation request", async () => {
    const data = mockRequest(
      mutation.setData({
        username: "Kacper",
        password: "Kacper1234",
      }),
      { data: { username: "prc", firstName: "Maciej" } },
    );

    const {
      data: response,
      error,
      status,
      extra,
    } = await mutation
      .setData({
        username: "Kacper",
        password: "Kacper1234",
      })
      .send();

    expect(response).toStrictEqual({ data });
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
  });

  it("should allow to cancel request and return error", async () => {
    mockRequest(request, { delay: 5 });

    setTimeout(() => {
      request.abort();
    }, 2);

    const { data: response, error } = await request.send();

    expect(response).toBe(null);
    expect(error.message).toEqual(getErrorMessage("abort").message);
  });

  it("should not throw when XMLHttpRequest is not available on window", async () => {
    const data = mockRequest(request, { delay: 20 });
    const xml = window.XMLHttpRequest;
    window.XMLHttpRequest = undefined as any;

    const { data: response, error, status, extra } = await request.send();

    expect(response).toStrictEqual({ data });
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
    await timeoutRequest.send();
    expect(instance.timeout).toBe(50);

    window.XMLHttpRequest = xml;
  });
});
