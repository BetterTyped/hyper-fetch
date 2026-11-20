import { Client, getErrorMessage } from "@hyper-fetch/core";
import { GraphqlAdapter, GraphqlMethod } from "adapter";

const url = "https://shared-base-url/graphql";
// Typed as plain strings: literals would also make the adapter infer the variables from the query text
const queryWithId = "query Q($id: ID!) { a(id: $id) }" as string;
const queryWithFilter = "query Q($filter: Filter) { a(filter: $filter) }" as string;

/** How the adapter turns every kind of GraphQL over HTTP response into a HyperFetch response. */
describe("Graphql Adapter [ Responses ]", () => {
  let client = new Client({ url }).setAdapter(GraphqlAdapter());
  let fetchSpy = vi.spyOn(globalThis, "fetch");

  const respond = (body: string, init: { status?: number; headers?: Record<string, string> } = {}) => {
    fetchSpy.mockResolvedValue(
      new Response(body, {
        status: init.status ?? 200,
        headers: { "content-type": "application/json", ...init.headers },
      }),
    );
  };

  const send = () => client.createRequest<{ response: { a: number } }>()({ endpoint: "query Q { a }" }).send();

  beforeEach(() => {
    client = new Client({ url }).setAdapter(GraphqlAdapter());
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe("when the request succeeds", () => {
    it("should return the data", async () => {
      respond('{"data":{"a":1}}');

      expect(await send()).toMatchObject({ data: { a: 1 }, error: null, success: true, status: 200 });
    });

    it("should treat an empty errors list as success", async () => {
      respond('{"data":{"a":1},"errors":[]}');

      expect(await send()).toMatchObject({ data: { a: 1 }, error: null, success: true, status: 200 });
    });

    it("should return null data when the server sends null", async () => {
      respond('{"data":null}');

      expect(await send()).toMatchObject({ data: null, error: null, success: true });
    });

    it("should expose the response headers and extensions", async () => {
      respond('{"data":{"a":1},"extensions":{"cost":5}}', { headers: { "x-trace": "abc" } });

      const response = await send();

      expect(response.extra?.extensions).toEqual({ cost: 5 });
      expect(response.extra?.headers).toMatchObject({ "x-trace": "abc" });
    });

    it("should default the extensions to an empty object", async () => {
      respond('{"data":{"a":1}}');

      const response = await send();

      expect(response.extra?.extensions).toEqual({});
    });
  });

  describe("when the request fails", () => {
    it("should return the GraphQL errors of a 200 response", async () => {
      respond('{"data":null,"errors":[{"message":"Not allowed","path":["a"]}]}');

      expect(await send()).toMatchObject({
        data: null,
        error: [{ message: "Not allowed", path: ["a"] }],
        success: false,
        status: 200,
      });
    });

    it("should fail when errors come together with partial data", async () => {
      respond('{"data":{"a":1},"errors":[{"message":"Partial"}]}');

      expect(await send()).toMatchObject({ data: null, error: [{ message: "Partial" }], success: false });
    });

    it("should expose the GraphQL errors in the extra of a failed response", async () => {
      respond('{"data":null,"errors":[{"message":"Not allowed"}]}');

      const response = await send();

      expect(response.extra?.errors).toEqual([{ message: "Not allowed" }]);
    });

    it.each([400, 401, 403, 404, 500, 503])("should return the errors of a %i response", async (status) => {
      respond('{"errors":[{"message":"Bad"}]}', { status });

      expect(await send()).toMatchObject({ data: null, error: [{ message: "Bad" }], success: false, status });
    });

    it.each([
      ["an HTML error page", "<html>Bad gateway</html>"],
      ["an empty body", ""],
      ["a JSON body without errors", '{"message":"down"}'],
    ])("should return the default error for a failed response with %s", async (_name, body) => {
      respond(body, { status: 502 });

      expect(await send()).toMatchObject({ data: null, error: [getErrorMessage()], success: false, status: 502 });
    });

    it("should return a network failure as a list of errors", async () => {
      const failure = new TypeError("Failed to fetch");
      fetchSpy.mockRejectedValue(failure);

      const response = await send();

      expect(response).toMatchObject({ data: null, success: false, status: 0 });
      expect(response.error).toEqual([failure]);
      expect(Array.isArray(response.error)).toBe(true);
    });

    it("should return an abort as a list of errors", async () => {
      fetchSpy.mockImplementation(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
          }),
      );
      const request = client.createRequest<{ response: { a: number } }>()({ endpoint: "query Q { a }" });

      const sent = request.send();
      await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
      request.abort();
      const response = await sent;

      expect(response.error).toEqual([getErrorMessage("abort")]);
      expect(response.status).toBe(0);
    });

    it("should return a timeout as an error", async () => {
      fetchSpy.mockImplementation(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
          }),
      );
      const request = client.createRequest<{ response: { a: number } }>()({
        endpoint: "query Q { a }",
        options: { timeout: 10 },
      });

      const response = await request.send();

      expect(response.success).toBe(false);
      expect(response.status).toBe(0);
      expect(response.error).toEqual([getErrorMessage("timeout")]);
    });
  });

  describe("with the error policy", () => {
    const sendWithPolicy = (errorPolicy?: "none" | "all") =>
      client
        .createRequest<{ response: { a: number; b: number | null } }>()({
          endpoint: "query Q { a b }",
          options: { errorPolicy },
        })
        .send();

    it.each([undefined, "none"] as const)("should fail on partial data with the %s policy", async (errorPolicy) => {
      respond('{"data":{"a":1,"b":null},"errors":[{"message":"No b","path":["b"]}]}');

      expect(await sendWithPolicy(errorPolicy)).toMatchObject({
        data: null,
        error: [{ message: "No b", path: ["b"] }],
        success: false,
      });
    });

    it("should succeed with the partial data and keep the errors in the extra with the all policy", async () => {
      respond('{"data":{"a":1,"b":null},"errors":[{"message":"No b","path":["b"]}]}');

      const response = await sendWithPolicy("all");

      expect(response).toMatchObject({ data: { a: 1, b: null }, error: null, success: true, status: 200 });
      expect(response.extra?.errors).toEqual([{ message: "No b", path: ["b"] }]);
    });

    it("should fail errors without data with the all policy", async () => {
      respond('{"data":null,"errors":[{"message":"Not allowed"}]}');

      expect(await sendWithPolicy("all")).toMatchObject({
        data: null,
        error: [{ message: "Not allowed" }],
        success: false,
      });
    });

    it("should fail a failed status with data with the all policy", async () => {
      respond('{"data":{"a":1,"b":null},"errors":[{"message":"Down"}]}', { status: 500 });

      expect(await sendWithPolicy("all")).toMatchObject({ data: null, error: [{ message: "Down" }], success: false });
    });

    it("should not add errors to the extra of a response without them with the all policy", async () => {
      respond('{"data":{"a":1,"b":2}}');

      const response = await sendWithPolicy("all");

      expect(response).toMatchObject({ data: { a: 1, b: 2 }, success: true });
      expect(response.extra).not.toHaveProperty("errors");
    });

    it("should take the policy from the adapter defaults and let the request options override it", async () => {
      const partial = '{"data":{"a":1,"b":null},"errors":[{"message":"No b"}]}';
      const defaulted = new Client({ url }).setAdapter(
        GraphqlAdapter().setAdapterDefaults(() => ({ errorPolicy: "all" })),
      );
      const request = defaulted.createRequest<{ response: { a: number; b: number | null } }>()({
        endpoint: "query Q { a b }",
      });

      respond(partial);
      expect(await request.send()).toMatchObject({ data: { a: 1, b: null }, success: true });

      respond(partial);
      expect(await request.setOptions({ errorPolicy: "none" }).send()).toMatchObject({ data: null, success: false });
    });

    it("should keep the partial data in the cache with the all policy", async () => {
      respond('{"data":{"a":1,"b":null},"errors":[{"message":"No b"}]}');
      const cachingClient = new Client({ url, mode: "client" }).setAdapter(GraphqlAdapter());
      const request = cachingClient.createRequest<{ response: { a: number; b: number | null } }>()({
        endpoint: "query Q { a b }",
        options: { errorPolicy: "all" },
      });

      await request.send();

      expect(cachingClient.cache.get(request.cacheKey)).toMatchObject({
        data: { a: 1, b: null },
        extra: { errors: [{ message: "No b" }] },
      });
    });
  });

  describe("when sending the operation", () => {
    it("should accept the GraphQL response media type with JSON as the fallback", async () => {
      respond('{"data":{"a":1}}');

      await send();

      expect(fetchSpy.mock.calls[0][1]?.headers).toMatchObject({
        Accept: "application/graphql-response+json, application/json;q=0.9",
      });
    });

    it.each(["Accept", "accept"])("should keep an %s header set by the user", async (key) => {
      respond('{"data":{"a":1}}');

      await client
        .createRequest<{ response: { a: number } }>()({
          endpoint: "query Q { a }",
          headers: { [key]: "application/json" },
        })
        .send();

      const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
      expect(Object.entries(headers).filter(([name]) => name.toLowerCase() === "accept")).toStrictEqual([
        [key, "application/json"],
      ]);
    });

    it("should POST the query and the variables as JSON", async () => {
      respond('{"data":{"a":1}}');
      const request = client.createRequest<{ response: { a: number }; payload: { id: number } }>()({
        endpoint: queryWithId,
        headers: { Authorization: "Bearer token" },
      });

      await request.send({ payload: { id: 7 } });

      const [input, init] = fetchSpy.mock.calls[0];
      expect(String(input)).toBe(url);
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        query: queryWithId,
        operationName: "Q",
        variables: { id: 7 },
      });
      expect(init?.headers).toMatchObject({ Authorization: "Bearer token" });
    });

    it("should GET the query and the JSON encoded variables in the url, without a body", async () => {
      respond('{"data":{"a":1}}');
      const request = client.createRequest<{
        response: { a: number };
        payload: { filter: { q: string; tags: string[] } };
      }>()({
        endpoint: queryWithFilter,
        method: GraphqlMethod.GET,
      });

      await request.send({ payload: { filter: { q: "x y&z=1", tags: ["ą", "b"] } } });

      const [input, init] = fetchSpy.mock.calls[0];
      const params = new URL(String(input)).searchParams;
      expect(params.get("query")).toBe(queryWithFilter);
      expect(params.get("operationName")).toBe("Q");
      expect(JSON.parse(params.get("variables") ?? "")).toEqual({ filter: { q: "x y&z=1", tags: ["ą", "b"] } });
      expect(init?.method).toBe("GET");
      expect(init?.body).toBeUndefined();
    });

    it("should not send an operationName for an anonymous operation", async () => {
      respond('{"data":{"a":1}}');

      await client.createRequest<{ response: { a: number } }>()({ endpoint: "{ a }" }).send();

      expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({ query: "{ a }" });
    });

    it("should send the name of the first operation when the document holds many", async () => {
      respond('{"data":{"a":1}}');
      const document = "query First { a } query Second { b }";

      await client.createRequest<{ response: { a: number } }>()({ endpoint: document }).send();

      expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toMatchObject({ operationName: "First" });
    });

    it("should not send an operationName for a document that does not parse", async () => {
      respond('{"errors":[{"message":"Syntax Error"}]}', { status: 400 });

      await client.createRequest<{ response: { a: number } }>()({ endpoint: "query Q {" }).send();

      expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({ query: "query Q {" });
    });

    it("should keep the operationName of the document over a query param with the same key in GET", async () => {
      respond('{"data":{"a":1}}');
      const request = client
        .createRequest<{ response: { a: number }; queryParams: { operationName: string } }>()({
          endpoint: "query Q { a }",
          method: GraphqlMethod.GET,
        })
        .setQueryParams({ operationName: "Other" });

      await request.send();

      expect(new URL(String(fetchSpy.mock.calls[0][0])).searchParams.getAll("operationName")).toStrictEqual(["Q"]);
    });

    it("should pass fetch options through", async () => {
      respond('{"data":{"a":1}}');
      const request = client.createRequest<{ response: { a: number } }>()({
        endpoint: "query Q { a }",
        options: { credentials: "include", mode: "cors", cache: "no-store" },
      });

      await request.send();

      expect(fetchSpy.mock.calls[0][1]).toMatchObject({ credentials: "include", mode: "cors", cache: "no-store" });
    });
  });
});
