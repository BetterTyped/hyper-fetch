import { createHttpMockingServer } from "@hyper-fetch/testing";
import type { Client } from "client";
import { createClient } from "client";
import type { HttpAdapterType } from "http-adapter";
import type { RequestModel } from "request";
import { Request } from "request";
import { createSdk } from "sdk";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

type TestClient = Client<Error, HttpAdapterType>;

// Schema does not need to declare `client` per request - the SDK injects it from createSdk(client).
type TestSchema = {
  users: {
    $get: RequestModel<{
      queryParams: { page: number; limit: number };
      endpoint: "/users";
    }>;
    $userId: {
      $get: RequestModel<{
        response: { id: string; name: string };
        endpoint: "/users/:userId";
      }>;
      $delete: RequestModel<{
        response: { id: string; name: string };
        endpoint: "/users/:userId";
      }>;
      posts: {
        $postId: {
          $delete: RequestModel<{
            response: { id: string; title: string };
            endpoint: "/users/:userId/posts/:postId";
          }>;
        };
      };
    };
  };
  acceptInvitation: {
    $post: RequestModel<{
      endpoint: "/accept-invitation";
    }>;
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

    const request = sdk.users.$userId.$get;

    expect(request).toBeInstanceOf(Request);
    expect(request.method).toBe("GET");
    expect(request.endpoint).toBe("/users/:userId");
  });

  it("should create sdk with nested requests", () => {
    const sdk = createSdk<TestClient, TestSchema>(client);
    expect(sdk).toBeDefined();

    const request = sdk.users.$userId.posts.$postId.$delete;

    expect(request).toBeInstanceOf(Request);
    expect(request.method).toBe("DELETE");
    expect(request.endpoint).toBe("/users/:userId/posts/:postId");
  });

  it("should not create request from Request own properties", () => {
    const sdk = createSdk<TestClient, TestSchema>(client);
    expect(sdk).toBeDefined();

    const request = sdk.users.$userId.$get.setParams({ userId: "1" });

    expect(request).toBeInstanceOf(Request);
    expect(request.endpoint).toBe("/users/1");
    expect(request.params).toEqual({ userId: "1" });
  });

  it("should allow to set many params", () => {
    const sdk = createSdk<TestClient, TestSchema>(client);
    expect(sdk).toBeDefined();

    const request = sdk.users.$userId.posts.$postId.$delete.setParams({ userId: "1", postId: "2" });

    expect(request).toBeInstanceOf(Request);
    expect(request.endpoint).toBe("/users/1/posts/2");
    expect(request.params).toEqual({ userId: "1", postId: "2" });
  });

  it("should handle kebab-case to camelCase conversion", () => {
    const sdk = createSdk<TestClient, TestSchema>(client, { camelCaseToKebabCase: true });
    expect(sdk).toBeDefined();

    const request = sdk.acceptInvitation.$post;

    expect(request).toBeInstanceOf(Request);
    expect(request.method).toBe("POST");
    expect(request.endpoint).toBe("/accept-invitation");
  });

  it("should not handle kebab-case to camelCase conversion", () => {
    const sdk = createSdk<TestClient, TestSchema>(client, { camelCaseToKebabCase: false });
    expect(sdk).toBeDefined();

    const request = sdk.acceptInvitation.$post;

    expect(request).toBeInstanceOf(Request);
    expect(request.method).toBe("POST");
    expect(request.endpoint).toBe("/acceptInvitation");
  });

  describe("when keys are mapped to path segments", () => {
    it("should use the mapped segment over the kebab-case conversion", () => {
      const sdk = createSdk<TestClient, TestSchema>(client, { pathSegments: { acceptInvitation: "acceptInvitation" } });

      expect(sdk.acceptInvitation.$post.endpoint).toBe("/acceptInvitation");
    });

    it("should convert the keys which are not mapped", () => {
      const sdk = createSdk<TestClient, TestSchema>(client, { pathSegments: { other: "other-segment" } });

      expect(sdk.acceptInvitation.$post.endpoint).toBe("/accept-invitation");
    });

    it("should map nested keys and keep the params", () => {
      const sdk = createSdk<TestClient, TestSchema>(client, { pathSegments: { posts: "blog_posts" } });

      const request = sdk.users.$userId.posts.$postId.$delete.setParams({ userId: "1", postId: "2" });

      expect(request.endpoint).toBe("/users/1/blog_posts/2");
    });

    it("should not read the segments from the object prototype", () => {
      const sdk = createSdk<TestClient, TestSchema>(client, { pathSegments: {} });
      // A key named like an Object.prototype member - its segment is not read from the prototype of the map
      const prototypeKey = (sdk as unknown as Record<string, unknown>)["constructor"] as { $get: { endpoint: string } };

      expect(prototypeKey.$get.endpoint).toBe("/constructor");
    });

    it("should keep the mapped segments in the configured sdk", () => {
      const sdk = createSdk<TestClient, TestSchema>(client, {
        pathSegments: { acceptInvitation: "acceptInvitation" },
      }).$configure({ "*": { retry: 2 } });

      expect(sdk.acceptInvitation.$post.endpoint).toBe("/acceptInvitation");
      expect(sdk.acceptInvitation.$post.retry).toBe(2);
    });
  });
});
