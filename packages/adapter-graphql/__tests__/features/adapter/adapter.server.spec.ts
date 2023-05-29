/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { print } from "graphql/language/printer";

import { resetInterceptors, startServer, stopServer, createRequestInterceptor } from "../../server";
import { graphqlAdapter } from "adapter";
import { GetUserQueryResponse, getUserQuery } from "../../constants/queries.constants";
import { LoginMutationVariables, loginMutation } from "../../constants/mutations.constants";

describe("Graphql Adapter [ Server ]", () => {
  const requestId = "test";

  let client = new Client({ url: "https://shared-base-url/graphql" });
  let request = client.createRequest<GetUserQueryResponse>()({ endpoint: print(getUserQuery) });
  let mutation = client.createRequest<GetUserQueryResponse, LoginMutationVariables>()({
    endpoint: print(loginMutation),
  });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "https://shared-base-url/graphql" });
    request = client.createRequest<GetUserQueryResponse>()({ endpoint: print(getUserQuery) });
    mutation = client.createRequest<GetUserQueryResponse, LoginMutationVariables>()({
      endpoint: print(loginMutation),
    });

    request.client.requestManager.addAbortController(request.abortKey, requestId);
    mutation.client.requestManager.addAbortController(mutation.abortKey, requestId);
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    const data = createRequestInterceptor(request, { fixture: { username: "prc", firstName: "Maciej" } });

    const { data: response, error, status, extra } = await graphqlAdapter(request, requestId);

    expect(response).toStrictEqual({ data });
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
  });

  it("should make a request and return error data with status", async () => {
    const data = createRequestInterceptor(request, { status: 400 });

    const { data: response, error, status, extra } = await graphqlAdapter(request, requestId);

    expect(response).toBe(null);
    expect(status).toBe(400);
    expect(error).toStrictEqual({ errors: [data] });
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
  });

  it("should allow to make mutation request", async () => {
    const data = createRequestInterceptor(
      mutation.setData({
        username: "Kacper",
        password: "Kacper1234",
      }),
      { fixture: { username: "prc", firstName: "Maciej" } },
    );

    const {
      data: response,
      error,
      status,
      extra,
    } = await graphqlAdapter(
      mutation.setData({
        username: "Kacper",
        password: "Kacper1234",
      }),
      requestId,
    );

    expect(response).toStrictEqual({ data });
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
  });
});
