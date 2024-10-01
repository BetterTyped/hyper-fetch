/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { createGraphqlMockingServer } from "@hyper-fetch/testing";
import https from "https";

import { GraphqlAdapter } from "../../../src/adapter";
import { GetUserQueryResponse, getUserQuery, getUserQueryString } from "../../constants/queries.constants";
import { LoginMutationVariables, loginMutation } from "../../constants/mutations.constants";

describe("Graphql Adapter [ Server ]", () => {
  const { startServer, stopServer, resetMocks, mockRequest } = createGraphqlMockingServer();
  const requestId = "test";
  const requestCopy = https.request;
  let clientHttp = new Client({ url: "shared-base-url" }).setAdapter(GraphqlAdapter).setDebug(true);
  let client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter).setDebug(true);
  let request = client.createRequest<GetUserQueryResponse>()({ endpoint: getUserQuery });
  let mutation = client.createRequest<GetUserQueryResponse, LoginMutationVariables>()({
    endpoint: loginMutation,
  });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client.clear();
    resetMocks();
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();

    clientHttp = new Client({ url: "shared-base-url" }).setAdapter(GraphqlAdapter);
    client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter);
    request = client.createRequest<GetUserQueryResponse>()({ endpoint: getUserQuery });
    mutation = client.createRequest<GetUserQueryResponse, LoginMutationVariables>()({
      endpoint: loginMutation,
    });
    client.requestManager.addAbortController(request.abortKey, requestId);
    client.appManager.isBrowser = false;
  });

  afterEach(() => {
    client.clear();
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    https.globalAgent.destroy();
  });

  afterAll(() => {
    stopServer();
  });

  it("should pick correct adapter and not throw", async () => {
    mockRequest(request);
    client.appManager.isBrowser = true;
    await expect(() => GraphqlAdapter(client)).not.toThrow();
  });

  it("should pick http module", async () => {
    mockRequest(request);
    await expect(() =>
      GraphqlAdapter(clientHttp).adapter(
        clientHttp.createRequest<GetUserQueryResponse>()({ endpoint: getUserQuery }),
        requestId,
      ),
    ).not.toThrow();
  });

  it("should pick https module", async () => {
    mockRequest(request);
    await expect(() => GraphqlAdapter(client).adapter(request, requestId)).not.toThrow();
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

    const { data, error, status, extra } = await client.createRequest()({ endpoint: getUserQueryString }).send();

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

    expect(data).toStrictEqual(expected.data);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect(extra).toStrictEqual({
      headers: { "content-type": "application/json", "content-length": "48" },
      extensions: {},
    });
  });

  it("should allow to set options", async () => {
    let receivedOptions: any;

    jest.spyOn(https, "request").mockImplementation((options, callback) => {
      receivedOptions = options;
      return requestCopy(options, callback);
    });

    const timeoutRequest = request.setOptions({ timeout: 10 });
    mockRequest(timeoutRequest, { delay: 20 });

    await timeoutRequest.send();

    expect(receivedOptions.timeout).toBe(10);
  });

  it("should allow to calculate payload size", async () => {
    let receivedOptions: any;

    jest.spyOn(https, "request").mockImplementation((options, callback) => {
      receivedOptions = options;
      return requestCopy(options, callback);
    });
    mockRequest(mutation);

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
    mockRequest(mutation);

    const buffer = Buffer.from("test");

    await mutation.send({
      data: buffer as any,
    });

    expect(receivedOptions.headers["Content-Length"]).toBeGreaterThan(0);
  });
});
