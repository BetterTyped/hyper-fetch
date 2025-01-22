/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { createGraphqlMockingServer } from "@hyper-fetch/testing";
import https from "https";

import { GraphqlAdapter } from "../../../src/adapter";
import { GetUserQueryResponse, getUserQuery, getUserQueryString } from "../../constants/queries.constants";
import { LoginMutationVariables, loginMutation } from "../../constants/mutations.constants";

const { startServer, stopServer, resetMocks, mockRequest } = createGraphqlMockingServer();

describe("Graphql Adapter [ Server ]", () => {
  const requestId = "test";
  // const requestCopy = https.request;
  let clientHttp = new Client({ url: "http://shared-base-url/graphql" }).setAdapter(GraphqlAdapter).setDebug(true);
  let client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter).setDebug(true);
  let requestHttp = clientHttp.createRequest<{ response: GetUserQueryResponse }>()({ endpoint: getUserQuery });
  let request = client.createRequest<{ response: GetUserQueryResponse }>()({ endpoint: getUserQuery });
  let mutation = client.createRequest<{ response: GetUserQueryResponse; payload: LoginMutationVariables }>()({
    endpoint: loginMutation,
  });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    clientHttp = new Client({ url: "http://shared-base-url/graphql" }).setAdapter(GraphqlAdapter);
    client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter);
    requestHttp = clientHttp.createRequest<{ response: GetUserQueryResponse }>()({ endpoint: getUserQuery });
    request = client.createRequest<{ response: GetUserQueryResponse }>()({ endpoint: getUserQuery });
    mutation = client.createRequest<{ response: GetUserQueryResponse; payload: LoginMutationVariables }>()({
      endpoint: loginMutation,
    });
    client.appManager.isBrowser = false;
  });

  afterEach(() => {
    client.clear();
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    https.globalAgent.destroy();
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should pick correct adapter and not throw", async () => {
    mockRequest(request);
    client.appManager.isBrowser = true;

    const adapter = GraphqlAdapter(client);

    expect(adapter).toBeDefined();
  });

  it("should pick http module", async () => {
    mockRequest(requestHttp);
    clientHttp.requestManager.addAbortController(requestHttp.abortKey, requestId);

    const res = await GraphqlAdapter(clientHttp).adapter(
      clientHttp.createRequest<{ response: GetUserQueryResponse }>()({ endpoint: getUserQuery }),
      requestId,
    );

    expect(res.data).toBeDefined();
  });

  it("should pick https module", async () => {
    mockRequest(request);
    client.requestManager.addAbortController(request.abortKey, requestId);

    const res = await GraphqlAdapter(client).adapter(request, requestId);

    expect(res.data).toBeDefined();
  });

  it("should make a request and return success data with status", async () => {
    const expected = mockRequest(request, { delay: 10, data: { username: "prc", firstName: "Maciej" } });

    const { data, error, status, extra } = await request.send();

    expect(error).toBe(null);
    expect(expected.data).toStrictEqual(data);
    expect(status).toBe(200);
    expect(extra).toMatchObject({
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
    expect(extra).toMatchObject({
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
    expect(extra).toMatchObject({
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
    expect(extra).toMatchObject({
      headers: { "content-type": "application/json", "content-length": "48" },
      extensions: {},
    });
  });

  // it("should allow to set options", async () => {
  //   let receivedOptions: any;

  //   jest.spyOn(https, "request").mockImplementation((options, callback) => {
  //     receivedOptions = options;
  //     return requestCopy(options, callback);
  //   });

  //   const timeoutRequest = request.setOptions({ timeout: 10 });
  //   mockRequest(timeoutRequest, { delay: 20 });

  //   await timeoutRequest.send();

  //   expect(receivedOptions.timeout).toBe(10);
  // });

  // it("should allow to calculate payload size", async () => {
  //   let receivedOptions: any;

  //   jest.spyOn(https, "request").mockImplementation((options, callback) => {
  //     receivedOptions = options;
  //     return requestCopy(options, callback);
  //   });
  //   mockRequest(mutation);

  //   await mutation.send({
  //     payload: {
  //       username: "Kacper",
  //       password: "Kacper1234",
  //     },
  //   });

  //   expect(receivedOptions.headers["Content-Length"]).toBeGreaterThan(0);
  // });

  // it("should allow to calculate Buffer size", async () => {
  //   let receivedOptions: any;

  //   jest.spyOn(https, "request").mockImplementation((options, callback) => {
  //     receivedOptions = options;
  //     return requestCopy(options, callback);
  //   });
  //   mockRequest(mutation);

  //   const buffer = Buffer.from("test");

  //   await mutation.send({
  //     payload: buffer as any,
  //   });

  //   expect(receivedOptions.headers["Content-Length"]).toBeGreaterThan(0);
  // });
});
