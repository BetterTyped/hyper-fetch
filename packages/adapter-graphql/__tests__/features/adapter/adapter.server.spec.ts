/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";
import https from "https";

import { resetInterceptors, startServer, stopServer, createRequestInterceptor } from "../../server";
import { graphqlAdapter } from "adapter";
import { GetUserQueryResponse, getUserQuery, getUserQueryString } from "../../constants/queries.constants";
import { LoginMutationVariables, loginMutation } from "../../constants/mutations.constants";

describe("Graphql Adapter [ Server ]", () => {
  const requestId = "test";
  const requestCopy = https.request;
  let clientHttp = new Client({ url: "shared-base-url" }).setAdapter(graphqlAdapter);
  let client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(graphqlAdapter);
  let request = client.createRequest<GetUserQueryResponse>()({ endpoint: getUserQuery });
  let mutation = client.createRequest<GetUserQueryResponse, LoginMutationVariables>()({
    endpoint: loginMutation,
  });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    clientHttp = new Client({ url: "shared-base-url" }).setAdapter(graphqlAdapter);
    client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(graphqlAdapter);
    request = client.createRequest<GetUserQueryResponse>()({ endpoint: getUserQuery });
    mutation = client.createRequest<GetUserQueryResponse, LoginMutationVariables>()({
      endpoint: loginMutation,
    });
    client.requestManager.addAbortController(request.abortKey, requestId);
    client.appManager.isBrowser = false;
    resetInterceptors();
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should pick correct adapter and not throw", async () => {
    createRequestInterceptor(request);
    client.appManager.isBrowser = true;
    await expect(() => graphqlAdapter(client)).not.toThrow();
  });

  it("should pick http module", async () => {
    createRequestInterceptor(request);
    await expect(() =>
      graphqlAdapter(clientHttp).adapter(
        clientHttp.createRequest<GetUserQueryResponse>()({ endpoint: getUserQuery }),
        requestId,
      ),
    ).not.toThrow();
  });

  it("should pick https module", async () => {
    createRequestInterceptor(request);
    await expect(() => graphqlAdapter(client).adapter(request, requestId)).not.toThrow();
  });

  it("should make a request and return success data with status", async () => {
    const data = createRequestInterceptor(request, { fixture: { username: "prc", firstName: "Maciej" } });

    const { data: response, error, status, extra } = await request.send();

    expect(response).toStrictEqual({ data });
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
  });

  it("should make a request with string endpoint", async () => {
    const data = createRequestInterceptor(request, { fixture: { username: "prc", firstName: "Maciej" } });

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
    const data = createRequestInterceptor(request, { status: 400 });

    const { data: response, error, status, extra } = await request.send();

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

  it("should allow to set options", async () => {
    let receivedOptions: any;

    jest.spyOn(https, "request").mockImplementation((options, callback) => {
      receivedOptions = options;
      return requestCopy(options, callback);
    });

    const timeoutRequest = request.setOptions({ timeout: 10 });
    createRequestInterceptor(timeoutRequest, { delay: 20 });

    await timeoutRequest.send();

    expect(receivedOptions.timeout).toBe(10);
  });

  it("should allow to calculate payload size", async () => {
    let receivedOptions: any;

    jest.spyOn(https, "request").mockImplementation((options, callback) => {
      receivedOptions = options;
      return requestCopy(options, callback);
    });
    createRequestInterceptor(mutation);

    await mutation.send({
      data: {
        username: "Kacper",
        password: "Kacper1234",
      },
    });

    expect(receivedOptions.headers["Content-Length"]).toBeGreaterThan(0);
  });

  it("should allow to calculate Buffer size", async () => {
    let receivedOptions: any;

    jest.spyOn(https, "request").mockImplementation((options, callback) => {
      receivedOptions = options;
      return requestCopy(options, callback);
    });
    createRequestInterceptor(mutation);

    const buffer = Buffer.from("test");

    await mutation.send({
      data: buffer as any,
    });

    expect(receivedOptions.headers["Content-Length"]).toBeGreaterThan(0);
  });
});
