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
      expect(response.error).toEqual(getErrorMessage("timeout"));
    });
  });

  describe("when sending the operation", () => {
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
      expect(JSON.parse(params.get("variables") ?? "")).toEqual({ filter: { q: "x y&z=1", tags: ["ą", "b"] } });
      expect(init?.method).toBe("GET");
      expect(init?.body).toBeUndefined();
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
