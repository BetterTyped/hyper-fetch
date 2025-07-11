import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Client, createClient } from "client";
import { HttpAdapterType } from "http-adapter";
import { Request, RequestInstance } from "request";
import { createSdk } from "sdk";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

type TestClient = Client<Error, HttpAdapterType>;

type TestSchema = {
  users: {
    get: RequestInstance<{
      client: TestClient;
      queryParams: { page: number; limit: number };
      endpoint: "/users";
    }>;
    $userId: {
      get: RequestInstance<{
        client: TestClient;
        response: { id: string; name: string };
        endpoint: "/users/:userId";
      }>;
      delete: RequestInstance<{
        client: TestClient;
        response: { id: string; name: string };
        endpoint: "/users/:userId";
      }>;
      posts: {
        $postId: {
          delete: RequestInstance<{
            client: TestClient;
            response: { id: string; title: string };
            endpoint: "/users/:userId/posts/:postId";
          }>;
        };
      };
    };
  };
};

describe("SDK [ Base ]", () => {
  let client: TestClient;

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    client = createClient<{ error: Error }>({ url: "http://localhost:3000" });
  });

  afterAll(() => {
    stopServer();
  });

  it("should create sdk", () => {
    const sdk = createSdk<TestClient, TestSchema>(client);
    expect(sdk).toBeDefined();

    const request = sdk.users.$userId.get;

    expect(request).toBeInstanceOf(Request);
    expect(request.method).toBe("GET");
    expect(request.endpoint).toBe("/users/:userId");
  });

  it("should create sdk with nested requests", () => {
    const sdk = createSdk<TestClient, TestSchema>(client);
    expect(sdk).toBeDefined();

    const request = sdk.users.$userId.posts.$postId.delete;

    expect(request).toBeInstanceOf(Request);
    expect(request.method).toBe("DELETE");
    expect(request.endpoint).toBe("/users/:userId/posts/:postId");
  });

  it("should not create request from Request own properties", () => {
    const sdk = createSdk<TestClient, TestSchema>(client);
    expect(sdk).toBeDefined();

    const request = sdk.users.$userId.get.setParams({ userId: "1" });

    expect(request).toBeInstanceOf(Request);
    expect(request.endpoint).toBe("/users/1");
    expect(request.params).toEqual({ userId: "1" });
  });

  it("should allow to set many params", () => {
    const sdk = createSdk<TestClient, TestSchema>(client);
    expect(sdk).toBeDefined();

    const request = sdk.users.$userId.posts.$postId.delete.setParams({ userId: "1", postId: "2" });

    expect(request).toBeInstanceOf(Request);
    expect(request.endpoint).toBe("/users/1/posts/2");
    expect(request.params).toEqual({ userId: "1", postId: "2" });
  });
});
