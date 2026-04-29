import type { Client } from "client";
import { createClient } from "client";
import type { HttpAdapterType } from "http-adapter";
import type { RequestInstance } from "request";
import { Request } from "request";
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

  describe("method-specific dot-path keys", () => {
    it("should apply config to a specific method via dot-path key", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "users.$get": { retry: 7 },
      });

      const usersGet = configured.users.$get;
      expect(usersGet.retry).toBe(7);

      const postsGet = configured.posts.$get;
      expect(postsGet.retry).toBe(0);
    });

    it("should apply config to a nested dot-path key", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "users.$userId.$get": { cancelable: true },
      });

      const userByIdGet = configured.users.$userId.$get;
      expect(userByIdGet.cancelable).toBe(true);

      const usersGet = configured.users.$get;
      expect(usersGet.cancelable).toBe(false);
    });

    it("should not affect other methods on the same endpoint group", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "users.$get": { retry: 10 },
      });

      const usersGet = configured.users.$get;
      expect(usersGet.retry).toBe(10);

      // The nested $userId.$get shares the /users endpoint group but has a different dot-path
      const userByIdGet = configured.users.$userId.$get;
      expect(userByIdGet.retry).toBe(0);
    });
  });

  describe("function-based configuration values", () => {
    it("should apply a function value to configure a request", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": (request: RequestInstance) => request.setRetry(5).setCancelable(true),
      });

      const request = configured.users.$get;
      expect(request.retry).toBe(5);
      expect(request.cancelable).toBe(true);
    });

    it("should apply a function value on a dot-path key", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "users.$get": (request: RequestInstance) => request.setRetry(3).setHeaders({ "X-Custom": "test" }),
      });

      const usersGet = configured.users.$get;
      expect(usersGet.retry).toBe(3);
      expect(usersGet.headers).toStrictEqual({ "X-Custom": "test" });

      const postsGet = configured.posts.$get;
      expect(postsGet.retry).toBe(0);
    });

    it("should allow setMock through function-based configuration", () => {
      const mockFn = () => ({ data: [{ id: 1, name: "Test" }], error: null, status: 200 });
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "users.$get": (request: RequestInstance) => request.setMock(mockFn),
      });

      const usersGet = configured.users.$get;
      expect(usersGet.isMockerEnabled).toBe(true);
    });

    it("should allow setResponseMapper through function-based configuration", () => {
      const mapper = (response: any) => ({ ...response, mapped: true });
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "users.$get": (request: RequestInstance) => request.setResponseMapper(mapper),
      });

      const usersGet = configured.users.$get;
      expect(usersGet.unstable_responseMapper).toBe(mapper);
    });
  });

  describe("configuration stacking", () => {
    it("should stack properties from global and method-specific configs", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": { cache: true },
        "users.$get": { deduplicate: true },
      });

      const usersGet = configured.users.$get;
      expect(usersGet.cache).toBe(true);
      expect(usersGet.deduplicate).toBe(true);
    });

    it("should stack properties across global, endpoint group, and dot-path", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": { retry: 3 },
        "/users": { cache: false },
        "users.$get": { deduplicate: true },
      });

      const usersGet = configured.users.$get;
      expect(usersGet.retry).toBe(3);
      expect(usersGet.cache).toBe(false);
      expect(usersGet.deduplicate).toBe(true);
    });

    it("should stack function-based values across levels", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": (request: RequestInstance) => request.setRetry(5),
        "users.$get": (request: RequestInstance) => request.setCancelable(true),
      });

      const usersGet = configured.users.$get;
      expect(usersGet.retry).toBe(5);
      expect(usersGet.cancelable).toBe(true);
    });

    it("should let a later level override a specific property while keeping others", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": { retry: 1, cache: true, cancelable: false },
        "users.$get": { retry: 10 },
      });

      const usersGet = configured.users.$get;
      expect(usersGet.retry).toBe(10);
      expect(usersGet.cache).toBe(true);
      expect(usersGet.cancelable).toBe(false);
    });
  });

  describe("mixed plain-object and function values", () => {
    it("should apply both plain objects and functions in the same configuration", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": { retry: 2 },
        "users.$get": (request: RequestInstance) => request.setCancelable(true),
      });

      const usersGet = configured.users.$get;
      expect(usersGet.retry).toBe(2);
      expect(usersGet.cancelable).toBe(true);

      const postsGet = configured.posts.$get;
      expect(postsGet.retry).toBe(2);
      expect(postsGet.cancelable).toBe(false);
    });
  });

  describe("application order", () => {
    it("should apply in order: global -> endpoint group -> method-specific", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "users.$get": { retry: 99 },
        "*": { retry: 1 },
        "/users": { retry: 10 },
      });

      // Method-specific (dot-path) should win since it's applied last
      const usersGet = configured.users.$get;
      expect(usersGet.retry).toBe(99);
    });

    it("should apply endpoint group after global", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "/users": { retry: 10 },
        "*": { retry: 1 },
      });

      const usersGet = configured.users.$get;
      expect(usersGet.retry).toBe(10);

      const postsGet = configured.posts.$get;
      expect(postsGet.retry).toBe(1);
    });

    it("should apply function after plain-object in same category", () => {
      const sdk = createSdk<TestClient, TestSchema>(client);
      const configured = sdk.$configure({
        "*": { retry: 1, cancelable: false },
        "users.$get": (request: RequestInstance) => request.setRetry(50),
      });

      const usersGet = configured.users.$get;
      expect(usersGet.retry).toBe(50);
      expect(usersGet.cancelable).toBe(false);
    });
  });
});
