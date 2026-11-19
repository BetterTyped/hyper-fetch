import { Client } from "client";
import type { RequestInstance, RequestModel } from "request";
import { Request } from "request";
import { createConfiguration, createSdk } from "sdk";

type User = { id: string; name: string };

type Schema = {
  users: {
    $get: RequestModel<{ response: User[]; endpoint: "/users" }>;
    $post: RequestModel<{ response: User; payload: { name: string }; endpoint: "/users" }>;
    $userId: {
      $get: RequestModel<{ response: User; endpoint: "/users/:userId" }>;
      $delete: RequestModel<{ response: null; endpoint: "/users/:userId" }>;
      posts: {
        $get: RequestModel<{ response: { id: string }[]; endpoint: "/users/:userId/posts" }>;
      };
    };
  };
  usersArchive: {
    $get: RequestModel<{ response: User[]; endpoint: "/users-archive" }>;
  };
  posts: {
    $get: RequestModel<{ response: { id: string }[]; endpoint: "/posts"; queryParams: { page: number } }>;
  };
};

describe("SDK [ Builder ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let sdk = createSdk<typeof client, Schema>(client);

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    sdk = createSdk<typeof client, Schema>(client);
  });

  afterEach(() => {
    client.clear();
  });

  describe("When the requests are built from the path", () => {
    it.each([
      { name: "collection", getRequest: () => sdk.users.$get, endpoint: "/users", method: "GET" },
      { name: "collection with another method", getRequest: () => sdk.users.$post, endpoint: "/users", method: "POST" },
      { name: "dynamic segment", getRequest: () => sdk.users.$userId.$get, endpoint: "/users/:userId", method: "GET" },
      {
        name: "dynamic segment with another method",
        getRequest: () => sdk.users.$userId.$delete,
        endpoint: "/users/:userId",
        method: "DELETE",
      },
      {
        name: "nested resource",
        getRequest: () => sdk.users.$userId.posts.$get,
        endpoint: "/users/:userId/posts",
        method: "GET",
      },
      {
        name: "camel case segment",
        getRequest: () => sdk.usersArchive.$get,
        endpoint: "/users-archive",
        method: "GET",
      },
    ])("should build the $name request", ({ getRequest, endpoint, method }) => {
      const request: RequestInstance = getRequest();

      expect(request).toBeInstanceOf(Request);
      expect(request.endpoint).toBe(endpoint);
      expect(request.method).toBe(method);
    });

    it("should bind the requests to the client of the sdk", () => {
      expect(sdk.users.$get.client).toBe(client);
      expect(sdk.users.$userId.posts.$get.client).toBe(client);
    });

    it("should create a new request with every access", () => {
      const first = sdk.users.$get;
      const second = sdk.users.$get;

      expect(first).not.toBe(second);
      expect(first.toJSON()).toStrictEqual(second.toJSON());
    });

    it("should keep the camel case segments when the conversion is disabled", () => {
      const rawSdk = createSdk<typeof client, Schema>(client, { camelCaseToKebabCase: false });

      expect(rawSdk.usersArchive.$get.endpoint).toBe("/usersArchive");
    });

    it("should transform the methods with the custom function", () => {
      const lowerSdk = createSdk<typeof client, Schema>(client, { methodTransform: (method) => method.toLowerCase() });

      expect(lowerSdk.users.$post.method).toBe("post");
    });

    it("should serialize the built request", () => {
      const serialized = JSON.stringify(sdk.users.$userId.$get);
      const json = JSON.parse(serialized);

      expect(json.endpoint).toBe("/users/:userId");
      expect(json.method).toBe("GET");
    });
  });

  describe("When the built requests are used", () => {
    it("should apply the params and the query params", () => {
      const withParams = sdk.users.$userId.$get.setParams({ userId: "1" });
      const withQueryParams = sdk.posts.$get.setQueryParams({ page: 2 });

      expect(withParams.endpoint).toBe("/users/1");
      expect(withQueryParams.queryParams).toStrictEqual({ page: 2 });
      expect(withQueryParams.cacheKey).not.toBe(sdk.posts.$get.cacheKey);
    });

    it("should not change the request of the sdk with the setters", () => {
      sdk.users.$get.setRetry(5).setCacheTime(1);

      expect(sdk.users.$get.retry).toBe(0);
      expect(sdk.users.$get.cacheTime).not.toBe(1);
    });

    it("should send the request and cache its response", async () => {
      const request = sdk.users.$userId.$get.setParams({ userId: "1" });
      request.setMock(() => ({ data: { id: "1", name: "Kate" }, status: 200 }));

      const response = await request.send();

      expect(response.data).toStrictEqual({ id: "1", name: "Kate" });
      expect(request.read()?.data).toStrictEqual({ id: "1", name: "Kate" });
      expect(client.cache.keys()).toStrictEqual([request.cacheKey]);
    });

    it("should share the cache between the requests built for the same endpoint", async () => {
      const request = sdk.users.$get;
      request.setMock(() => ({ data: [{ id: "1", name: "Kate" }], status: 200 }));

      await request.send();

      expect(sdk.users.$get.read()?.data).toStrictEqual([{ id: "1", name: "Kate" }]);
      expect(sdk.posts.$get.read()).toBeUndefined();
    });
  });

  describe("When the sdk is configured", () => {
    it("should return a new sdk and leave the original one untouched", () => {
      const configured = sdk.$configure({ "*": { retry: 3 } });

      expect(configured).not.toBe(sdk);
      expect(configured.users.$get.retry).toBe(3);
      expect(sdk.users.$get.retry).toBe(0);
    });

    it("should merge the configurations of the chained calls", () => {
      const configured = sdk.$configure({ "*": { retry: 3 } }).$configure({ "/users": { cacheTime: 1000 } });

      expect(configured.users.$get.retry).toBe(3);
      expect(configured.users.$get.cacheTime).toBe(1000);
      expect(configured.posts.$get.retry).toBe(3);
      expect(configured.posts.$get.cacheTime).not.toBe(1000);
    });

    it("should replace the configuration of the key configured again", () => {
      const configured = sdk.$configure({ "*": { retry: 3, cacheTime: 1000 } }).$configure({ "*": { retry: 5 } });

      expect(configured.users.$get.retry).toBe(5);
      expect(configured.users.$get.cacheTime).not.toBe(1000);
    });

    it("should merge the configuration with the defaults of the sdk", () => {
      const withDefaults = createSdk<typeof client, Schema>(client, { defaults: { "*": { retry: 2 } } });

      const configured = withDefaults.$configure({ "/posts": { retry: 4 } });

      expect(withDefaults.posts.$get.retry).toBe(2);
      expect(configured.users.$get.retry).toBe(2);
      expect(configured.posts.$get.retry).toBe(4);
    });

    it("should keep the options of the sdk in the configured one", () => {
      const rawSdk = createSdk<typeof client, Schema>(client, { camelCaseToKebabCase: false });

      expect(rawSdk.$configure({ "*": { retry: 1 } }).usersArchive.$get.endpoint).toBe("/usersArchive");
    });

    it.each([
      { name: "retry", defaults: { retry: 0 }, read: (request: RequestInstance) => request.retry, expected: 0 },
      { name: "cache", defaults: { cache: false }, read: (request: RequestInstance) => request.cache, expected: false },
      { name: "auth", defaults: { auth: false }, read: (request: RequestInstance) => request.auth, expected: false },
      {
        name: "staleTime",
        defaults: { staleTime: 0 },
        read: (request: RequestInstance) => request.staleTime,
        expected: 0,
      },
      {
        name: "cacheTime",
        defaults: { cacheTime: 0 },
        read: (request: RequestInstance) => request.cacheTime,
        expected: 0,
      },
      {
        name: "deduplicate",
        defaults: { deduplicate: false },
        read: (request: RequestInstance) => request.deduplicate,
        expected: false,
      },
    ])("should apply the falsy value of $name", ({ defaults, read, expected }) => {
      const configured = sdk.$configure({ "*": { retry: 5, staleTime: 1000, cacheTime: 1000 }, "/users": defaults });

      expect(read(configured.users.$get)).toBe(expected);
    });

    it("should apply the configuration in the documented order no matter how the keys are sorted", () => {
      const configured = sdk.$configure({
        "users.$get": { retry: 3 },
        "/users": { retry: 2, cacheTime: 2000 },
        "*": { retry: 1, cacheTime: 1000, staleTime: 500 },
      });

      expect(configured.users.$get.retry).toBe(3);
      expect(configured.users.$get.cacheTime).toBe(2000);
      expect(configured.users.$get.staleTime).toBe(500);
      expect(configured.users.$post.retry).toBe(2);
      expect(configured.posts.$get.retry).toBe(1);
    });

    it("should pass the request to the configuration function and use the returned one", () => {
      const configuration = vi.fn((request: RequestInstance) => request.setRetry(7));
      const configured = sdk.$configure({ "users.$userId.$get": configuration });

      const request = configured.users.$userId.$get;

      expect(request.retry).toBe(7);
      expect(configuration).toHaveBeenCalledTimes(1);
      expect(configuration.mock.calls[0][0].endpoint).toBe("/users/:userId");
      expect(configured.users.$userId.$delete.retry).toBe(0);
    });

    it("should return the same map from the configuration factory", () => {
      const configuration = { "*": { retry: 1 } };

      expect(createConfiguration<Schema>()(configuration)).toBe(configuration);
    });
  });

  describe("When the configuration keys are matched", () => {
    it("should match the endpoint and everything below it with the wildcard", () => {
      const configured = sdk.$configure({ "/users/*": { retry: 4 } });

      expect(configured.users.$get.retry).toBe(4);
      expect(configured.users.$userId.$get.retry).toBe(4);
      expect(configured.users.$userId.posts.$get.retry).toBe(4);
    });

    it("should not match the endpoints which only start with the same text", () => {
      const configured = sdk.$configure({ "/users/*": { retry: 4 }, "/users": { cacheTime: 1 } });

      expect(configured.usersArchive.$get.retry).toBe(0);
      expect(configured.usersArchive.$get.cacheTime).not.toBe(1);
      expect(configured.posts.$get.retry).toBe(0);
    });

    it("should match only the exact endpoint with the endpoint key", () => {
      const configured = sdk.$configure({ "/users": { retry: 4 } });

      expect(configured.users.$get.retry).toBe(4);
      expect(configured.users.$post.retry).toBe(4);
      expect(configured.users.$userId.$get.retry).toBe(0);
    });

    it("should match only the given method with the path key", () => {
      const configured = sdk.$configure({ "users.$userId.$delete": { retry: 4 } });

      expect(configured.users.$userId.$delete.retry).toBe(4);
      expect(configured.users.$userId.$get.retry).toBe(0);
      expect(configured.users.$get.retry).toBe(0);
    });
  });

  describe("When many sdks are used", () => {
    it("should not share the configuration between the sdks", () => {
      const first = sdk.$configure({ "*": { retry: 1 } });
      const second = sdk.$configure({ "*": { cacheTime: 1000 } });

      expect(first.users.$get.cacheTime).not.toBe(1000);
      expect(second.users.$get.retry).toBe(0);
    });

    it("should bind every sdk to its own client", async () => {
      const otherClient = new Client({ url: "other-base-url" });
      const otherSdk = createSdk<typeof otherClient, Schema>(otherClient);
      const request = sdk.users.$get;
      request.setMock(() => ({ data: [], status: 200 }));

      await request.send();

      expect(otherSdk.users.$get.client).toBe(otherClient);
      expect(otherSdk.users.$get.read()).toBeUndefined();
      expect(sdk.users.$get.read()?.data).toStrictEqual([]);
      otherClient.clear();
    });
  });
});
