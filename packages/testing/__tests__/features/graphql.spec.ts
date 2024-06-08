import { Client, getErrorMessage } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";

import { createGraphqlMockingServer } from "../../src/graphql";
import { GetUserQueryResponse, getUserQuery, getUserQueryString } from "../constants/queries.constants";
import { LoginMutationVariables, loginMutation } from "../constants/mutations.constants";

describe("Graphql Mocking [ Base ]", () => {
  const { startServer, stopServer, resetMocks, mockRequest } = createGraphqlMockingServer();
  let client = new Client({
    url: "https://shared-base-url/graphql",
  }).setAdapter(GraphqlAdapter);
  let request = client.createRequest<GetUserQueryResponse>()({ endpoint: getUserQuery });
  let mutation = client.createRequest<GetUserQueryResponse, LoginMutationVariables>()({
    endpoint: loginMutation,
  });

  beforeAll(() => {
    startServer();
  });

  beforeEach(async () => {
    client = new Client({
      url: "https://shared-base-url/graphql",
    }).setAdapter(GraphqlAdapter);
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

  it("should mock a request", async () => {
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

  it("should mock string based graphql request", async () => {
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

  it("should mock the error status", async () => {
    const expected = mockRequest(request, { status: 200, error: [{ message: "Some Error" }] });

    const { data, error, status, extra } = await request.send();

    expect(data).toBe(null);
    expect(status).toBe(200);
    expect(expected.errors).toStrictEqual(error);
    expect(extra).toStrictEqual({
      headers: { "content-type": "application/json", "content-length": "47" },
      extensions: {},
    });
  });

  // TODO: Add handling of this case
  // it("should mock both errors and data", async () => {
  //   const expectedData = { username: "prc", firstName: "Maciej" };
  //   const expectedError = [{ message: "Some Error" }];

  //   const expected = mockRequest(request, {
  //     status: 200,
  //     data: expectedData,
  //     error: expectedError,
  //   });

  //   const { data, error, status, extra } = await request.send();

  //   expect(data).toBe(expected.data);
  //   expect(status).toBe(200);
  //   expect(error).toStrictEqual(expected.errors);
  //   expect(extra).toStrictEqual({
  //     headers: { "content-type": "application/json", "content-length": "37" },
  //     extensions: {},
  //   });
  // });

  it("should allow to make mutation request", async () => {
    const expected = mockRequest(
      mutation.setData({
        username: "Kacper",
        password: "Kacper1234",
      }),
      { data: { username: "prc", firstName: "Maciej" } },
    );

    const { data, error, status, extra } = await mutation
      .setData({
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

  it("should mock the timeout of request", async () => {
    mockRequest(request.setOptions({ timeout: 0 }), { delay: 100 });
    const { data, status, error, extra } = await request.send();

    expect(data).toBeNull();
    expect(status).toBe(500);
    expect(error).toStrictEqual([{ message: getErrorMessage("timeout").message }]);
    expect(extra.headers).toStrictEqual({
      "content-length": "42",
      "content-type": "application/json",
    });
  });

  it("should mock the adapter abort of request", async () => {
    mockRequest(request, { delay: 100 });
    const requestPromise = request.send();

    client.requestManager.abortAll();

    const { data, status, error, extra } = await requestPromise;

    expect(data).toBeNull();
    expect(status).toBe(0);
    expect(error).toStrictEqual([getErrorMessage("abort")]);
    expect(extra.headers).toStrictEqual({});
  });
});
