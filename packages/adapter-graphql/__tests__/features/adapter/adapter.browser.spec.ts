import { Client, getErrorMessage } from "@hyper-fetch/core";
import { createGraphqlMockingServer } from "@hyper-fetch/testing";
import { GraphqlAdapter } from "adapter";

import type { LoginMutationVariables } from "../../constants/mutations.constants";
import { loginMutation } from "../../constants/mutations.constants";
import type { GetUserQueryResponse } from "../../constants/queries.constants";
import { getUserQuery, getUserQueryString } from "../../constants/queries.constants";

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
    vi.resetAllMocks();
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

  it("should allow to set options and timeout the request", async () => {
    const timeoutRequest = request.setOptions({ timeout: 5 });
    mockRequest(timeoutRequest, { delay: 500 });

    const { data, error, status } = await timeoutRequest.send();

    expect(data).toBeNull();
    expect(status).toBe(0);
    expect(error).toStrictEqual(getErrorMessage("timeout"));
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

  it("should fallback to response.text() when body.getReader is not available", async () => {
    const responseData = JSON.stringify({ data: { username: "prc", firstName: "Maciej" } });
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      body: null,
      text: () => Promise.resolve(responseData),
    });

    const { data, status, error } = await request.send();

    expect(status).toBe(200);
    expect(data).toStrictEqual({ username: "prc", firstName: "Maciej" });
    expect(error).toBe(null);

    global.fetch = originalFetch;
  });

  it("should handle network error in catch block when not aborted", async () => {
    const originalFetch = global.fetch;
    const networkError = new Error("Network failure");
    global.fetch = vi.fn().mockRejectedValue(networkError);

    const { data, error, status } = await request.send();

    expect(data).toBeNull();
    expect(status).toBe(0);
    expect(error).toBe(networkError);

    global.fetch = originalFetch;
  });

  it("should handle request with abort controller present", async () => {
    mockRequest(request, { data: { username: "prc", firstName: "Maciej" } });

    const { data, status, error } = await request.send();

    expect(status).toBe(200);
    expect(data).toStrictEqual({ username: "prc", firstName: "Maciej" });
    expect(error).toBe(null);
  });

  it("should handle response with content-length header for progress tracking", async () => {
    const responseData = JSON.stringify({ data: { username: "prc", firstName: "Maciej" } });
    const encoder = new TextEncoder();
    const encoded = encoder.encode(responseData);
    const originalFetch = global.fetch;

    let readerDone = false;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "application/json",
        "content-length": String(encoded.length),
      }),
      body: {
        getReader: () => ({
          read: () => {
            if (!readerDone) {
              readerDone = true;
              return Promise.resolve({ done: false, value: encoded });
            }
            return Promise.resolve({ done: true, value: undefined });
          },
        }),
      },
    });

    const { data, status } = await request.send();

    expect(status).toBe(200);
    expect(data).toStrictEqual({ username: "prc", firstName: "Maciej" });

    global.fetch = originalFetch;
  });

  it("should handle failure response when body has no getReader", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({ "content-type": "application/json" }),
      body: null,
      text: () => Promise.resolve(JSON.stringify({ errors: ["Internal Server Error"] })),
    });

    const { data, error, status } = await request.send();

    expect(data).toBeNull();
    expect(status).toBe(500);
    expect(error).toStrictEqual(["Internal Server Error"]);

    global.fetch = originalFetch;
  });
});
