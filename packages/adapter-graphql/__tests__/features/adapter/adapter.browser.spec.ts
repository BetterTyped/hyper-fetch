import { Client, getErrorMessage } from "@hyper-fetch/core";
import { createGraphqlMockingServer } from "@hyper-fetch/testing";

import { GraphqlAdapter } from "adapter";
import { GetUserQueryResponse, getUserQuery, getUserQueryString } from "../../constants/queries.constants";
import { LoginMutationVariables, loginMutation } from "../../constants/mutations.constants";

const { startServer, stopServer, resetMocks, mockRequest } = createGraphqlMockingServer();

describe("Graphql Adapter [ Browser ]", () => {
  let client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter());
  let request = client.createRequest<{ response: GetUserQueryResponse }>()({ endpoint: getUserQuery });
  let mutation = client.createRequest<{ response: GetUserQueryResponse; payload: LoginMutationVariables }>()({
    endpoint: loginMutation,
  });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter());
    request = client.createRequest<{ response: GetUserQueryResponse }>()({ endpoint: getUserQuery });
    mutation = client.createRequest<{ response: GetUserQueryResponse; payload: LoginMutationVariables }>()({
      endpoint: loginMutation,
    });

    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    const expected = mockRequest(request, { data: { username: "prc", firstName: "Maciej" } });

    const { data, error, status, extra } = await request.send();

    expect(expected.data).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({
      headers: { "content-type": "application/json", "content-length": "48" },
      extensions: {},
    });
  });

  it("should make a request with string endpoint", async () => {
    const expected = mockRequest(request, { data: { username: "prc", firstName: "Maciej" } });

    const { data, error, status, extra } = await client.createRequest()({ endpoint: getUserQueryString }).send({});

    expect(expected.data).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({
      headers: { "content-type": "application/json", "content-length": "48" },
      extensions: {},
    });
  });

  it("should make a request and return error data with status", async () => {
    const expected = mockRequest(request, { status: 400 });

    const { data, error, status, extra } = await request.send();

    expect(data).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual(expected.errors);
    expect(extra).toStrictEqual({
      headers: { "content-type": "application/json", "content-length": "42" },
      extensions: {},
    });
  });

  it("should allow to make mutation request", async () => {
    const expected = mockRequest(
      mutation.setPayload({
        username: "Kacper",
        password: "Kacper1234",
      }),
      { data: { username: "prc", firstName: "Maciej" } },
    );

    const { data, error, status, extra } = await mutation
      .setPayload({
        username: "Kacper",
        password: "Kacper1234",
      })
      .send();

    expect(expected.data).toStrictEqual(data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({
      headers: { "content-type": "application/json", "content-length": "48" },
      extensions: {},
    });
  });

  it("should allow to cancel request and return error", async () => {
    mockRequest(request, { delay: 5 });

    setTimeout(() => {
      request.abort();
    }, 2);

    const { data, error } = await request.send();

    expect(data).toBe(null);
    expect(error).toStrictEqual([getErrorMessage("abort")]);
  });

  // it("should not throw when XMLHttpRequest is not available on window", async () => {
  //   const expected = mockRequest(request, { delay: 20 });
  //   const xml = window.XMLHttpRequest;
  //   window.XMLHttpRequest = undefined as any;

  //   const { data, error, status, extra } = await request.send();

  //   expect(expected.data).toStrictEqual(data);
  //   expect(status).toBe(200);
  //   expect(error).toBe(null);
  //   expect(extra).toMatchObject({
  //     headers: { "content-type": "application/json", "content-length": "11" },
  //     extensions: {},
  //   });
  //   window.XMLHttpRequest = xml;
  // });

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
    expect(instance!.timeout).toBe(50);

    window.XMLHttpRequest = xml;
  });

  it("should handle undefined response data as null", async () => {
    mockRequest(request, { data: null });
    const { data } = await request.send();
    expect(data).toBe(null);
  });

  it("should use default error message when errors are null", async () => {
    mockRequest(request, {
      status: 400,
      error: null,
    });

    const { error } = await request.send();
    expect(error).toStrictEqual([getErrorMessage()]);
  });
});
