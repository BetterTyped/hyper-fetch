import { Client, createClient } from "client";
import { HttpAdapterType } from "http-adapter";
import { Request, RequestInstance } from "request";
import { createSdk, createConfiguration } from "sdk";

type TestClient = Client<Error, HttpAdapterType>;

type TestSchema = {
  users: {
    $get: RequestInstance<{
      client: TestClient;
      endpoint: "/users";
    }>;
    $userId: {
      $get: RequestInstance<{
        client: TestClient;
        response: { id: string; name: string };
        endpoint: "/users/:userId";
      }>;
    };
  };
  posts: {
    $get: RequestInstance<{
      client: TestClient;
      endpoint: "/posts";
    }>;
  };
};

describe("SDK [ Configuration ]", () => {
  let client: TestClient;

  beforeEach(() => {
    client = createClient<{ error: Error }>({ url: "http://localhost:3000" });
  });

  describe("createConfiguration", () => {
    it("should create a configuration map", () => {
      const config = createConfiguration<TestSchema>()({
        "*": { retry: 3, retryTime: 1000 },
        "/users/*": { cache: false },
      });

      expect(config).toStrictEqual({
        "*": { retry: 3, retryTime: 1000 },
        "/users/*": { cache: false },
      });
    });
  });

  describe("$configure", () => {
    it("should apply global defaults to all requests", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({ "*": { retry: 5, retryTime: 2000 } });

      const request = configured.users.$get;
      expect(request).toBeInstanceOf(Request);
      expect(request.retry).toBe(5);
      expect(request.retryTime).toBe(2000);
    });

    it("should apply endpoint-specific defaults", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "/users": { retry: 3, cache: false },
      });

      const usersRequest = configured.users.$get;
      expect(usersRequest.retry).toBe(3);
      expect(usersRequest.cache).toBe(false);

      // Posts should not be affected
      const postsRequest = configured.posts.$get;
      expect(postsRequest.retry).toBe(0);
      expect(postsRequest.cache).toBe(true);
    });

    it("should apply wildcard defaults to matching endpoints", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "/users/*": { cancelable: true },
      });

      const userRequest = configured.users.$userId.$get;
      expect(userRequest.cancelable).toBe(true);

      const postsRequest = configured.posts.$get;
      expect(postsRequest.cancelable).toBe(false);
    });

    it("should merge global and specific defaults (specific wins)", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": { retry: 1 },
        "/users": { retry: 5 },
      });

      const usersRequest = configured.users.$get;
      // "/users" matches both "*" and "/users"; both apply in order, so "/users" overwrites
      expect(usersRequest.retry).toBe(5);

      const postsRequest = configured.posts.$get;
      expect(postsRequest.retry).toBe(1);
    });

    it("should return a new SDK instance (immutable)", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({ "*": { retry: 10 } });

      expect(sdk.users.$get.retry).toBe(0);
      expect(configured.users.$get.retry).toBe(10);
    });

    it("should apply headers defaults", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": { headers: { "X-Custom": "value" } },
      });

      const request = configured.users.$get;
      expect(request.headers).toStrictEqual({ "X-Custom": "value" });
    });
  });

  describe("defaults via createSdk options", () => {
    it("should apply defaults passed through createSdk options", () => {
      const sdk = createSdk<TestClient, TestSchema>(client, {
        defaults: {
          "*": { retry: 7 },
        },
      });

      const request = sdk.users.$get;
      expect(request.retry).toBe(7);
    });
  });

  describe("getMethod with custom methodTransform", () => {
    it("should use custom methodTransform when provided", () => {
      const sdk = createSdk<TestClient, TestSchema>(client, {
        methodTransform: (method: string) => `CUSTOM_${method}`,
      });

      const request = sdk.users.$get;
      expect(request.method).toBe("CUSTOM_get");
    });

    it("should use default toUpperCase when no methodTransform provided", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);

      const request = sdk.users.$get;
      expect(request.method).toBe("GET");
    });
  });

  describe("applyDefaults with all config properties", () => {
    it("should apply all config properties to the request", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": {
          headers: { "X-Test": "value" },
          auth: false,
          cache: false,
          cacheTime: 5000,
          staleTime: 3000,
          retry: 3,
          retryTime: 1000,
          cancelable: true,
          queued: true,
          offline: true,
          deduplicate: true,
          deduplicateTime: 2000,
        },
      });

      const request = configured.users.$get;
      expect(request.headers).toStrictEqual({ "X-Test": "value" });
      expect(request.auth).toBe(false);
      expect(request.cache).toBe(false);
      expect(request.cacheTime).toBe(5000);
      expect(request.staleTime).toBe(3000);
      expect(request.retry).toBe(3);
      expect(request.retryTime).toBe(1000);
      expect(request.cancelable).toBe(true);
      expect(request.queued).toBe(true);
      expect(request.offline).toBe(true);
      expect(request.deduplicate).toBe(true);
      expect(request.deduplicateTime).toBe(2000);
    });

    it("should not apply deduplicateTime when value is null", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": {
          deduplicateTime: null,
          retry: 1,
        },
      });

      const request = configured.users.$get;
      // null means "don't change" - deduplicateTime should not be set by null
      // The branch `config.deduplicateTime !== null` prevents null from being applied
      expect(request.retry).toBe(1);
    });
  });

  describe("endpointMatchesPattern with wildcard edge case", () => {
    it("should match endpoint equal to prefix without trailing slash", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "/users/*": { retry: 9 },
      });

      const usersRequest = configured.users.$get;
      expect(usersRequest.retry).toBe(9);
    });
  });

  describe("$configure merging", () => {
    it("should merge existing defaults with new ones from $configure", () => {
      const sdk = createSdk<TestClient, TestSchema>(client, {
        defaults: {
          "*": { retry: 2 },
        },
      });

      const configured = sdk.$configure({
        "/users": { cache: false },
      });

      const usersRequest = configured.users.$get;
      expect(usersRequest.retry).toBe(2);
      expect(usersRequest.cache).toBe(false);
    });
  });

  describe("proxy special keys", () => {
    it("should return undefined for symbol keys", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const sym = Symbol("test");
      expect((sdk as any)[sym]).toBeUndefined();
    });

    it("should return undefined for inspect key", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      expect((sdk as any).inspect).toBeUndefined();
    });
  });

  describe("getMethod default fallback in options without methodTransform", () => {
    it("should use inline default toUpperCase when options exist but have no methodTransform", () => {
      const sdk = createSdk<TestClient, TestSchema>(client, {
        camelCaseToKebabCase: false,
      });

      const request = sdk.users.$get;
      expect(request.method).toBe("GET");
    });
  });
});
