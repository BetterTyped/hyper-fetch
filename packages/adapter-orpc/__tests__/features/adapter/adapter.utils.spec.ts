import { createClient, getErrorMessage } from "@hyper-fetch/core";

import {
  createOrpcSerializer,
  getOrpcAbortKey,
  getOrpcHeaders,
  getOrpcHttpRequest,
  getOrpcRequestKey,
  getOrpcResult,
  maxGetUrlLength,
  OrpcAdapter,
  orpcEndpointMapper,
} from "../../../src/adapter";

const url = "http://localhost:3000/rpc";

describe("Orpc Adapter [ Utils ]", () => {
  const serializer = createOrpcSerializer();
  const client = createClient({ url }).setAdapter(OrpcAdapter());

  const createQuery = (endpoint = "user/byId") =>
    client.createRequest<{ response: unknown; payload: unknown; queryParams: Record<string, string> }>()({
      endpoint,
    });
  const createMutation = (endpoint = "user/create") =>
    client.createRequest<{ response: unknown; payload: unknown }>()({ endpoint, method: "MUTATION" });

  describe("when mapping the endpoint", () => {
    it.each([
      ["health", "/health"],
      ["/health", "/health"],
      ["user/byId", "/user/byId"],
      ["/user/byId/", "/user/byId"],
      ["//user//byId", "/user/byId"],
      ["user/with space", "/user/with%20space"],
      ["", "/"],
    ])("should map %j to %j", (endpoint, path) => {
      expect(orpcEndpointMapper(endpoint)).toBe(path);
    });
  });

  describe("when building the keys", () => {
    it("should include the input in the cache and query keys", () => {
      const first = getOrpcRequestKey(createQuery().setPayload({ id: 1 }), serializer);
      const second = getOrpcRequestKey(createQuery().setPayload({ id: 2 }), serializer);

      expect(first).toBe('QUERY_/user/byId-{"json":{"id":1}}-');
      expect(second).not.toBe(first);
    });

    it("should not mix primitive inputs of a different type", () => {
      const number = getOrpcRequestKey(createQuery().setPayload(1), serializer);
      const string = getOrpcRequestKey(createQuery().setPayload("1"), serializer);

      expect(number).not.toBe(string);
    });

    it("should keep the special types distinct from their JSON form", () => {
      const date = new Date("2024-01-01T00:00:00.000Z");
      const asDate = getOrpcRequestKey(createQuery().setPayload({ at: date }), serializer);
      const asString = getOrpcRequestKey(createQuery().setPayload({ at: date.toISOString() }), serializer);
      const asBigInt = getOrpcRequestKey(createQuery().setPayload({ total: 1n }), serializer);
      const asNumber = getOrpcRequestKey(createQuery().setPayload({ total: 1 }), serializer);

      expect(asDate).not.toBe(asString);
      expect(asBigInt).not.toBe(asNumber);
    });

    it("should share the keys between the SDK path and the procedure path", () => {
      const fromSdk = getOrpcRequestKey(createQuery("/user/byId").setPayload({ id: 1 }), serializer);
      const byHand = getOrpcRequestKey(createQuery("user/byId").setPayload({ id: 1 }), serializer);

      expect(fromSdk).toBe(byHand);
    });

    it("should separate the methods and query params", () => {
      const query = getOrpcRequestKey(createQuery("user/create").setPayload({ id: 1 }), serializer);
      const mutation = getOrpcRequestKey(createMutation().setPayload({ id: 1 }), serializer);
      const withParams = getOrpcRequestKey(
        createQuery("user/create").setPayload({ id: 1 }).setQueryParams({ v: "2" }),
        serializer,
      );

      expect(query).not.toBe(mutation);
      expect(query).not.toBe(withParams);
    });

    it("should tell the files apart by their metadata", () => {
      const key = (file: File) => getOrpcRequestKey(createMutation().setPayload({ name: "a", file }), serializer);
      const notes = new File(["notes"], "notes.txt", { type: "text/plain" });

      expect(key(notes)).toBe(key(new File(["notes"], "notes.txt", { type: "text/plain" })));
      expect(key(notes)).not.toBe(key(new File(["other"], "other.txt", { type: "text/plain" })));
      expect(key(notes)).not.toBe(key(new File(["notes"], "notes.txt", { type: "text/markdown" })));
      expect(key(notes)).not.toBe(key(new File(["longer notes"], "notes.txt", { type: "text/plain" })));
      expect(key(notes)).toContain('"maps":[["file"]]');
    });

    it("should not include the input in the abort key", () => {
      const first = getOrpcAbortKey(createQuery().setPayload({ id: 1 }));
      const second = getOrpcAbortKey(createQuery().setPayload({ id: 2 }));

      expect(first).toBe("QUERY_/user/byId-false");
      expect(second).toBe(first);
    });

    it("should not throw for an input that can't be serialized", () => {
      const failing = createOrpcSerializer([
        {
          type: 100,
          condition: (value) => value instanceof Error,
          serialize: () => {
            throw new Error("Cannot serialize");
          },
          deserialize: (value) => value,
        },
      ]);

      expect(getOrpcRequestKey(createQuery().setPayload(new Error("input")), failing)).toBe("QUERY_/user/byId--");
    });
  });

  describe("when building the headers", () => {
    it("should keep only the request headers", () => {
      expect(getOrpcHeaders(createQuery().setHeaders({ authorization: "Bearer token" }))).toStrictEqual({
        authorization: "Bearer token",
      });
      expect(getOrpcHeaders(createQuery())).toStrictEqual({});
    });
  });

  describe("when building the http request", () => {
    const build = ({
      request = createQuery(),
      payload,
      queryParams,
      queryMethod = "POST",
      headers = {},
    }: {
      request?: ReturnType<typeof createQuery> | ReturnType<typeof createMutation>;
      payload?: unknown;
      queryParams?: unknown;
      queryMethod?: "GET" | "POST";
      headers?: Record<string, string>;
    }) => {
      return getOrpcHttpRequest({
        request,
        endpoint: orpcEndpointMapper(request.endpoint),
        queryParams,
        headers,
        payload,
        queryMethod,
        serializer,
      });
    };

    it("should send the input as a JSON body with POST", () => {
      expect(build({ payload: { id: 1 }, headers: { "x-id": "1" } })).toStrictEqual({
        url: `${url}/user/byId`,
        method: "POST",
        headers: { "Content-Type": "application/json", "x-id": "1" },
        body: '{"json":{"id":1}}',
      });
    });

    it("should send an empty object without an input", () => {
      expect(build({}).body).toBe("{}");
    });

    it("should describe the special types in the meta", () => {
      const body = build({ payload: { at: new Date(0), total: 2n } }).body as string;

      expect(JSON.parse(body)).toStrictEqual({
        json: { at: "1970-01-01T00:00:00.000Z", total: "2" },
        meta: [
          [1, "at"],
          [0, "total"],
        ],
      });
    });

    it("should let the user content type win", () => {
      expect(build({ payload: 1, headers: { "Content-Type": "text/plain" } }).headers).toStrictEqual({
        "Content-Type": "text/plain",
      });
    });

    it("should send the input in the data query param with GET", () => {
      const request = build({ payload: { id: 1 }, queryMethod: "GET", headers: { "x-id": "1" } });

      expect(request).toStrictEqual({
        url: `${url}/user/byId?data=${encodeURIComponent('{"json":{"id":1}}')}`.replaceAll("%20", "+"),
        method: "GET",
        headers: { "x-id": "1" },
      });
    });

    it("should send an empty object in the data query param without an input", () => {
      expect(build({ queryMethod: "GET" }).url).toBe(`${url}/user/byId?data=%7B%7D`);
    });

    it("should send mutations with POST even when queries use GET", () => {
      expect(build({ request: createMutation(), payload: { id: 1 }, queryMethod: "GET" }).method).toBe("POST");
    });

    it("should fall back to POST when the GET url is too long", () => {
      const fits = "a".repeat(maxGetUrlLength - `${url}/user/byId?data=%7B%22json%22%3A%22%22%7D`.length);

      expect(build({ payload: fits, queryMethod: "GET" }).method).toBe("GET");
      expect(build({ payload: `${fits}a`, queryMethod: "GET" }).method).toBe("POST");
    });

    it("should send the files as multipart form data", () => {
      const file = new File(["content"], "notes.txt", { type: "text/plain" });

      const request = build({ payload: { file }, queryMethod: "GET", headers: { "x-id": "1" } });

      expect(request.method).toBe("POST");
      expect(request.headers).toStrictEqual({ "x-id": "1" });
      expect(request.body).toBeInstanceOf(FormData);
      const body = request.body as FormData;
      expect(JSON.parse(body.get("data") as string)).toStrictEqual({ json: { file: {} }, maps: [["file"]] });
      expect(body.get("0")).toBeInstanceOf(File);
    });

    it("should handle a trailing slash and a query string in the client url", () => {
      const slashClient = createClient({ url: `${url}/?v=2&data=client` }).setAdapter(OrpcAdapter());
      const request = slashClient.createRequest()({ endpoint: "health" });

      const post = getOrpcHttpRequest({
        request,
        endpoint: "/health",
        queryParams: undefined,
        headers: {},
        payload: undefined,
        queryMethod: "POST",
        serializer,
      });

      expect(post.url).toBe(`${url}/health?v=2&data=client`);
    });

    it("should append the query params without the reserved ones", () => {
      expect(build({ queryParams: { page: "2", data: "user" } }).url).toBe(`${url}/user/byId?page=2`);
      expect(build({ queryParams: "?page=2&data=user", payload: 1, queryMethod: "GET" }).url).toBe(
        `${url}/user/byId?page=2&data=${encodeURIComponent('{"json":1}')}`,
      );
    });
  });

  describe("when reading the response", () => {
    const read = (body: string | FormData, status = 200) => getOrpcResult({ body, status, serializer });

    it("should read the data", () => {
      expect(read('{"json":{"id":1}}')).toStrictEqual({ isSuccess: true, data: { id: 1 } });
    });

    it("should deserialize the special types", () => {
      const body = JSON.stringify({
        json: { at: "1970-01-01T00:00:00.000Z", total: "2" },
        meta: [
          [1, "at"],
          [0, "total"],
        ],
      });

      expect(read(body)).toStrictEqual({ isSuccess: true, data: { at: new Date(0), total: 2n } });
    });

    it("should map a missing output to null", () => {
      expect(read("")).toStrictEqual({ isSuccess: true, data: null });
      expect(read("{}")).toStrictEqual({ isSuccess: true, data: null });
    });

    it.each([[0], [false], [""]])("should keep the %j output", (data) => {
      expect(read(JSON.stringify({ json: data }))).toStrictEqual({ isSuccess: true, data });
    });

    it("should read a multipart body", () => {
      const form = new FormData();
      form.set("data", JSON.stringify({ json: { file: {} }, maps: [["file"]] }));
      form.set("0", new File(["content"], "notes.txt"));

      const result = read(form);

      expect(result.isSuccess).toBe(true);
      expect(result.isSuccess && (result.data as { file: File }).file.name).toBe("notes.txt");
    });

    it("should read the error with all of its fields", () => {
      const error = { defined: true, code: "NOT_FOUND", status: 404, message: "Missing", data: { id: 1 } };

      expect(read(JSON.stringify({ json: { ...error, extra: "field" } }), 404)).toStrictEqual({
        isSuccess: false,
        error,
      });
    });

    it("should add the data key to an error without data", () => {
      const result = read(
        JSON.stringify({ json: { defined: false, code: "CONFLICT", status: 409, message: "" } }),
        409,
      );

      expect(result).toStrictEqual({
        isSuccess: false,
        error: { defined: false, code: "CONFLICT", status: 409, message: "", data: undefined },
      });
      expect(result.isSuccess === false && Object.keys(result.error as object)).toContain("data");
    });

    it.each([
      ["an HTML page", "<html>Bad gateway</html>", 502],
      ["a plain text", "Not found", 404],
      ["a number", "1", 200],
      ["a JSON without the error fields", '{"json":{"message":"Nope"}}', 500],
      ["an error with a wrong field type", '{"json":{"defined":false,"code":1,"status":500,"message":""}}', 500],
    ])("should fail for %s", (_name, body, status) => {
      expect(read(body, status)).toStrictEqual({ isSuccess: false, error: getErrorMessage() });
    });

    it("should treat statuses from 400 up as errors", () => {
      const error = { defined: false, code: "BAD_REQUEST", status: 400, message: "Bad", data: "details" };

      expect(read(JSON.stringify({ json: error }), 399)).toStrictEqual({ isSuccess: true, data: error });
      expect(read(JSON.stringify({ json: error }), 400)).toStrictEqual({ isSuccess: false, error });
    });
  });
});
