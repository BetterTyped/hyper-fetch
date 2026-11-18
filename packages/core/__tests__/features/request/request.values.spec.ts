import { Client } from "client";
import { Request } from "request";

describe("Request [ Values ]", () => {
  const client = new Client({ url: "http://values" });

  describe("When params are put into the endpoint", () => {
    const withParams = (endpoint: string, params: Record<string, string | number>) =>
      client
        .createRequest()({ endpoint })
        .setParams(params as never).endpoint;

    it.each([
      { endpoint: "/users/:userId", params: { userId: 1 }, expected: "/users/1" },
      { endpoint: "/users/:userId", params: { userId: "john" }, expected: "/users/john" },
      { endpoint: "/users/:userId/posts/:postId", params: { userId: 1, postId: 2 }, expected: "/users/1/posts/2" },
      { endpoint: "/users/:userId/posts/:postId", params: { postId: 2, userId: 1 }, expected: "/users/1/posts/2" },
      { endpoint: ":version/users", params: { version: "v2" }, expected: "v2/users" },
      { endpoint: "/compare/:id/with/:id", params: { id: 7 }, expected: "/compare/7/with/7" },
      { endpoint: "/items/:id", params: { id: 0 }, expected: "/items/0" },
      { endpoint: "/items/:id", params: { id: "" }, expected: "/items/" },
    ])("should build $expected from $endpoint", ({ endpoint, params, expected }) => {
      expect(withParams(endpoint, params as unknown as Record<string, string | number>)).toBe(expected);
    });

    it("should not let a short param name replace the beginning of a longer one", () => {
      expect(withParams("/a/:id/b/:idx", { id: 1, idx: 2 })).toBe("/a/1/b/2");
      expect(withParams("/a/:idx/b/:id", { id: 1, idx: 2 })).toBe("/a/2/b/1");
      expect(withParams("/:user/:userId/:userIdentity", { user: "a", userId: "b", userIdentity: "c" })).toBe("/a/b/c");
    });

    it("should not treat a value as another param", () => {
      expect(withParams("/:first/:second", { first: ":second", second: "value" })).toBe("/:second/value");
    });

    it.each(["$&", "$1", "$$", "$`", "$'", "a$b"])("should keep the %s value as it is", (value) => {
      expect(withParams("/files/:name/raw", { name: value })).toBe(`/files/${value}/raw`);
    });

    it("should leave the params without a value in the endpoint", () => {
      expect(withParams("/users/:userId/posts/:postId", { userId: 1 })).toBe("/users/1/posts/:postId");
    });

    it("should ignore the values which are not in the endpoint", () => {
      expect(withParams("/users/:userId", { userId: 1, other: 2 })).toBe("/users/1");
    });

    it("should handle param names with special characters", () => {
      expect(withParams("/files/:file.name/:a+b", { "file.name": "report", "a+b": 3 })).toBe("/files/report/3");
    });

    it("should not touch the endpoint without params", () => {
      const request = client.createRequest()({ endpoint: "/time/12:30" });

      expect(request.endpoint).toBe("/time/12:30");
      expect(request.clone().endpoint).toBe("/time/12:30");
    });

    it("should replace the params from the template every time, not from the previous result", () => {
      const request = client.createRequest()({ endpoint: "/users/:userId" });

      const first = request.setParams({ userId: 1 });
      const second = first.setParams({ userId: 2 });

      expect(first.endpoint).toBe("/users/1");
      expect(second.endpoint).toBe("/users/2");
      expect(request.endpoint).toBe("/users/:userId");
    });

    it("should use the params given to send", async () => {
      const request = client.createRequest<{ response: any }>()({ endpoint: "/users/:userId" });
      const endpoints: string[] = [];
      request.setMock(
        ({ request: sent }) => {
          endpoints.push(sent.endpoint);
          return { data: null, status: 200 };
        },
        { requestTime: 0, responseTime: 0 },
      );

      await request.send({ params: { userId: 5 } });
      await request.setParams({ userId: 6 }).send();

      expect(endpoints).toEqual(["/users/5", "/users/6"]);
    });
  });

  describe("When the payload is set", () => {
    const request = client.createRequest<{ payload: any; response: any }>()({ endpoint: "/payload", method: "POST" });

    it.each([
      ["zero", 0],
      ["false", false],
      ["an empty string", ""],
      ["an empty object", {}],
      ["an empty array", []],
      ["an object", { name: "John" }],
      ["a nested object", { user: { tags: ["a", "b"] } }],
      ["a string", "text"],
      ["a number", 12.5],
    ])("should keep %s as the payload", (_, payload) => {
      expect(request.setPayload(payload).payload).toStrictEqual(payload);
    });

    it("should keep the reference of the payload", () => {
      const payload = { name: "John" };

      expect(request.setPayload(payload).payload).toBe(payload);
      expect(request.setPayload(payload).setRetry(1).payload).toBe(payload);
    });

    it("should keep a falsy payload in the next clones", () => {
      expect(request.setPayload(0).setRetry(2).setHeaders({ a: "b" }).payload).toBe(0);
      expect(request.setPayload(false).clone().payload).toBe(false);
    });

    it("should replace the previous payload", () => {
      expect(request.setPayload({ a: 1 }).setPayload({ b: 2 }).payload).toStrictEqual({ b: 2 });
      expect(request.setPayload({ a: 1 }).setPayload(0).payload).toBe(0);
    });

    it("should keep the binary payloads untouched", () => {
      const formData = new FormData();
      const blob = new Blob(["content"]);
      const buffer = new ArrayBuffer(8);

      expect(request.setPayload(formData).clone().payload).toBe(formData);
      expect(request.setPayload(blob).clone().payload).toBe(blob);
      expect(request.setPayload(buffer).clone().payload).toBe(buffer);
    });

    it("should use the payload given to send", async () => {
      const payloads: unknown[] = [];
      const mocked = request.clone().setMock(
        ({ request: sent }) => {
          payloads.push(sent.payload);
          return { data: null, status: 200 };
        },
        { requestTime: 0, responseTime: 0 },
      );

      await mocked.send({ payload: 0 });
      await mocked.send({ payload: false });
      await mocked.send({ payload: { a: 1 } });
      await mocked.setPayload({ a: 1 }).send({ payload: { b: 2 } } as never);

      expect(payloads).toStrictEqual([0, false, { a: 1 }, { b: 2 }]);
    });
  });

  describe("When query params are set", () => {
    const request = client.createRequest<{ queryParams: any }>()({ endpoint: "/query" });

    it.each([
      ["an object", { page: 1, search: "john" }],
      ["an array value", { ids: [1, 2, 3] }],
      ["a nested object", { filter: { role: "admin" } }],
      ["a date", { since: new Date(0) }],
      ["empty values", { a: null, b: undefined, c: "" }],
      ["a string", "?page=1"],
    ])("should keep %s", (_, queryParams) => {
      expect(request.setQueryParams(queryParams).queryParams).toStrictEqual(queryParams);
    });

    it("should not change the endpoint", () => {
      expect(request.setQueryParams({ page: 1 }).endpoint).toBe("/query");
    });

    it("should replace the previous query params instead of merging them", () => {
      const updated = request.setQueryParams({ page: 1, search: "john" }).setQueryParams({ page: 2 });

      expect(updated.queryParams).toStrictEqual({ page: 2 });
    });

    it.each([
      [{ page: 1 }, "?page=1"],
      [{ search: "a b&c=d" }, "?search=a%20b%26c%3Dd"],
      [{ "weird key": "ż" }, "?weird%20key=%C5%BC"],
      [{ ids: [1, 2, 3] }, "?ids[]=1&ids[]=2&ids[]=3"],
      [{ ids: [] }, ""],
      [{ a: null, b: undefined, c: "" }, ""],
      [{ a: 0, b: false }, "?a=0&b=false"],
      [{ since: new Date(0) }, "?since=1970-01-01T00%3A00%3A00.000Z"],
      [{ filter: { role: "admin" } }, `?filter=${encodeURIComponent('{"role":"admin"}')}`],
      ["page=1", "?page=1"],
      ["?page=1", "?page=1"],
      ["", ""],
      [null, ""],
      [{}, ""],
    ])("should turn %o into the %s query string", (queryParams, expected) => {
      expect(client.adapter.unstable_queryParamsMapper(queryParams)).toBe(expected);
    });
  });

  describe("When keys are generated", () => {
    const getUser = client.createRequest<{ queryParams?: any; payload?: any }>()({ endpoint: "/users/:userId" });

    it("should give the same keys for the same request made twice", () => {
      const first = getUser.setParams({ userId: 1 }).setQueryParams({ page: 1 });
      const second = getUser.setParams({ userId: 1 }).setQueryParams({ page: 1 });

      expect(first.cacheKey).toBe(second.cacheKey);
      expect(first.queryKey).toBe(second.queryKey);
      expect(first.abortKey).toBe(second.abortKey);
    });

    it("should give different cache and query keys for different params", () => {
      const first = getUser.setParams({ userId: 1 });
      const second = getUser.setParams({ userId: 2 });

      expect(first.cacheKey).not.toBe(second.cacheKey);
      expect(first.queryKey).not.toBe(second.queryKey);
    });

    it("should give different cache and query keys for different query params", () => {
      const first = getUser.setQueryParams({ page: 1 });
      const second = getUser.setQueryParams({ page: 2 });

      expect(first.cacheKey).not.toBe(second.cacheKey);
      expect(first.queryKey).not.toBe(second.queryKey);
    });

    it("should give different keys for different methods", () => {
      const get = client.createRequest()({ endpoint: "/same", method: "GET" });
      const post = client.createRequest()({ endpoint: "/same", method: "POST" });

      expect(get.cacheKey).not.toBe(post.cacheKey);
      expect(get.queryKey).not.toBe(post.queryKey);
      expect(get.abortKey).not.toBe(post.abortKey);
    });

    it("should give different keys for different endpoints", () => {
      const users = client.createRequest()({ endpoint: "/users" });
      const posts = client.createRequest()({ endpoint: "/posts" });

      expect(users.cacheKey).not.toBe(posts.cacheKey);
      expect(users.queryKey).not.toBe(posts.queryKey);
      expect(users.abortKey).not.toBe(posts.abortKey);
    });

    it("should not depend on the payload, headers or behavior options", () => {
      const changed = getUser
        .setPayload({ a: 1 })
        .setHeaders({ a: "b" })
        .setRetry(3)
        .setQueued(true)
        .setOffline(false)
        .setCache(false);

      expect(changed.cacheKey).toBe(getUser.cacheKey);
      expect(changed.queryKey).toBe(getUser.queryKey);
      expect(changed.abortKey).toBe(getUser.abortKey);
    });

    it("should share the abort key between all the params of one endpoint", () => {
      expect(getUser.setParams({ userId: 1 }).abortKey).toBe(getUser.setParams({ userId: 2 }).abortKey);
    });

    it("should use a different abort key for the cancelable requests", () => {
      expect(getUser.setCancelable(true).abortKey).not.toBe(getUser.abortKey);
    });

    it("should use the key mappers of the client", () => {
      const custom = new Client({ url: "http://values" })
        .setCacheKeyMapper((request) => `cache:${request.endpoint}`)
        .setQueryKeyMapper((request) => `query:${request.endpoint}`)
        .setAbortKeyMapper((request) => `abort:${request.endpoint}`);
      const request = custom.createRequest()({ endpoint: "/users/:userId" }).setParams({ userId: 1 });

      expect([request.cacheKey, request.queryKey, request.abortKey]).toEqual([
        "cache:/users/1",
        "query:/users/1",
        "abort:/users/1",
      ]);
    });

    it("should not put the scope into the keys of the request", () => {
      const scoped = getUser.setScope("session");

      expect(scoped.scope).toBe("session");
      expect(scoped.cacheKey).toBe(getUser.cacheKey);
      expect(scoped.setRetry(1).scope).toBe("session");
    });
  });

  describe("When the request is dumped to JSON", () => {
    const createConfigured = () =>
      client
        .createRequest<{ payload: any; queryParams: any; response: any }>()({
          endpoint: "/users/:userId",
          method: "PATCH",
          retry: 2,
          disableRequestInterceptors: true,
        })
        .setParams({ userId: 1 })
        .setQueryParams({ page: 1 })
        .setPayload({ name: "John" })
        .setHeaders({ "X-Test": "1" })
        .setOptions({ timeout: 100 })
        .setRetryTime(700)
        .setCacheTime(10)
        .setStaleTime(20)
        .setQueued(true)
        .setOffline(false)
        .setCancelable(true)
        .setAuth(false)
        .setUsed(true)
        .setDeduplicate(true)
        .setDeduplicateTime(50)
        .setStructuralSharing(false)
        .setScope("session");

    it("should recreate an equal request", () => {
      const request = createConfigured();

      const recreated = Request.fromJSON(client, request.toJSON());

      expect(recreated).toBeInstanceOf(Request);
      expect(recreated.toJSON()).toStrictEqual(request.toJSON());
    });

    it("should survive being stringified", () => {
      const request = createConfigured();

      const stored = JSON.stringify(request);

      const recreated = client.fromJSON(JSON.parse(stored));

      expect(recreated.toJSON()).toEqual(request.toJSON());
      expect(recreated.endpoint).toBe("/users/1");
      expect(recreated.payload).toStrictEqual({ name: "John" });
    });

    it("should keep the keys set by hand", () => {
      const request = createConfigured().setCacheKey("cache").setQueryKey("query").setAbortKey("abort");

      const recreated = Request.fromJSON(client, request.toJSON());

      expect([recreated.cacheKey, recreated.queryKey, recreated.abortKey]).toEqual(["cache", "query", "abort"]);
      expect(recreated.setRetry(1).cacheKey).toBe("cache");
    });

    it("should keep generating the keys of a recreated request", () => {
      const request = client.createRequest()({ endpoint: "/users/:userId" }).setParams({ userId: 1 });

      const recreated = Request.fromJSON(client, request.toJSON());

      expect(recreated.cacheKey).toBe(request.cacheKey);
      expect(recreated.setParams({ userId: 2 }).cacheKey).toBe(request.setParams({ userId: 2 }).cacheKey);
    });

    it("should keep the template endpoint to accept other params", () => {
      const recreated = Request.fromJSON(client, createConfigured().toJSON());

      expect(recreated.requestOptions.endpoint).toBe("/users/:userId");
      expect(recreated.setParams({ userId: 9 }).endpoint).toBe("/users/9");
    });

    it("should tell if the request had a mock", () => {
      const request = createConfigured();

      expect(request.toJSON().hasMock).toBe(false);
      request.setMock(() => ({ data: null, status: 200 }));

      expect(request.toJSON()).toMatchObject({ hasMock: true, isMockerEnabled: true });
    });

    it("should not dump the functions", () => {
      const request = createConfigured()
        .setRetryOnError(() => true)
        .setResponseMapper((response) => response)
        .setRequestMapper((mapped) => mapped)
        .setPayloadMapper((payload) => payload);

      const values = Object.values(request.toJSON());

      expect(values.some((value) => typeof value === "function")).toBe(false);
    });
  });
});
