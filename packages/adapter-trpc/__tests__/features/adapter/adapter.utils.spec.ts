import { createClient, getErrorMessage } from "@hyper-fetch/core";
import { deserialize, serialize } from "superjson";

import {
  getTrpcAbortKey,
  getTrpcHeaders,
  getTrpcInput,
  getTrpcRequestKey,
  getTrpcResult,
  getTrpcUrl,
  TrpcAdapter,
  trpcEndpointMapper,
} from "../../../src/adapter";

const superjson = { serialize, deserialize };

describe("Trpc Adapter [ Utils ]", () => {
  const createTestClient = (url = "http://localhost:3000/trpc") => createClient({ url }).setAdapter(TrpcAdapter());

  describe("when mapping the endpoint", () => {
    it.each([
      ["user.byId", "user.byId"],
      ["/user/byId", "user.byId"],
      ["/health", "health"],
      ["health", "health"],
      ["/a/b/c/", "a.b.c"],
    ])("should map %s to %s", (endpoint, procedure) => {
      expect(trpcEndpointMapper(endpoint)).toBe(procedure);
    });
  });

  describe("when encoding the input", () => {
    it("should return undefined when there is no input", () => {
      expect(getTrpcInput(undefined)).toBeUndefined();
    });

    it.each([
      [{ id: 1 }, '{"id":1}'],
      [0, "0"],
      [false, "false"],
      ["", '""'],
      [null, "null"],
    ])("should encode %j", (input, encoded) => {
      expect(getTrpcInput(input)).toBe(encoded);
    });

    it("should use the transformer", () => {
      const date = new Date("2024-01-01T00:00:00.000Z");

      expect(JSON.parse(getTrpcInput({ date }, superjson) as string)).toStrictEqual(superjson.serialize({ date }));
    });
  });

  describe("when building the keys", () => {
    const getRequest = (endpoint: string, method: "QUERY" | "MUTATION" = "QUERY") =>
      createTestClient().createRequest<{ response: unknown; payload: unknown; queryParams: { a: number } }>()({
        endpoint,
        method,
      });

    it("should include the input in the cache and query keys", () => {
      const first = getRequest("user.byId").setPayload({ id: 1 });
      const second = getRequest("user.byId").setPayload({ id: 2 });

      expect(first.cacheKey).not.toBe(second.cacheKey);
      expect(first.queryKey).not.toBe(second.queryKey);
      expect(first.cacheKey).toBe(getTrpcRequestKey(first));
    });

    it("should not mix primitive inputs of a different type", () => {
      const text = getRequest("user.byId").setPayload("1");
      const number = getRequest("user.byId").setPayload(1);

      expect(text.cacheKey).not.toBe(number.cacheKey);
    });

    it("should share the keys between the SDK path and the procedure path", () => {
      const sdk = getRequest("/user/byId").setPayload({ id: 1 });
      const manual = getRequest("user.byId").setPayload({ id: 1 });

      expect(sdk.cacheKey).toBe(manual.cacheKey);
      expect(sdk.queryKey).toBe(manual.queryKey);
      expect(sdk.abortKey).toBe(manual.abortKey);
    });

    it("should separate the methods and query params", () => {
      const query = getRequest("user.byId").setPayload({ id: 1 });
      const mutation = getRequest("user.byId", "MUTATION").setPayload({ id: 1 });
      const withParams = query.setQueryParams({ a: 1 });

      expect(query.cacheKey).not.toBe(mutation.cacheKey);
      expect(query.cacheKey).not.toBe(withParams.cacheKey);
    });

    it("should not include the input in the abort key", () => {
      const first = getRequest("user.byId").setPayload({ id: 1 });
      const second = getRequest("user.byId").setPayload({ id: 2 });

      expect(first.abortKey).toBe(second.abortKey);
      expect(first.abortKey).toBe(getTrpcAbortKey(first));
    });

    it("should keep inputs handled by the transformer distinct", () => {
      const client = createClient({ url: "http://localhost:3000/trpc" }).setAdapter(
        TrpcAdapter({ transformer: superjson }),
      );
      const request = client.createRequest<{ response: unknown; payload: unknown }>()({ endpoint: "user.byId" });

      const first = request.setPayload(new Map([["a", 1]]));
      const second = request.setPayload(new Map([["b", 2]]));

      expect(first.cacheKey).not.toBe(second.cacheKey);
    });

    it("should not throw for an input that can't be serialized", () => {
      const request = getRequest("user.byId");

      expect(() => request.setPayload({ id: 1n })).not.toThrow();
    });
  });

  describe("when building the headers", () => {
    const client = createTestClient();

    it("should send the content type with mutations", () => {
      const request = client.createRequest()({ endpoint: "user.create", method: "MUTATION" });

      expect(getTrpcHeaders(request)).toStrictEqual({ "Content-Type": "application/json" });
    });

    it("should not send the content type with queries", () => {
      const request = client.createRequest()({ endpoint: "user.byId", method: "QUERY" });

      expect(getTrpcHeaders(request)).toStrictEqual({});
    });

    it("should keep the request headers", () => {
      const request = client.createRequest()({
        endpoint: "user.create",
        method: "MUTATION",
        headers: { Authorization: "Bearer token" },
      });

      expect(getTrpcHeaders(request)).toStrictEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      });
    });
  });

  describe("when building the url", () => {
    const getQuery = (url?: string) => createTestClient(url).createRequest()({ endpoint: "/user/byId" });

    it("should encode the query input", () => {
      const input = JSON.stringify({ name: "a b&c" });

      expect(getTrpcUrl(getQuery(), "", input)).toBe(
        `http://localhost:3000/trpc/user.byId?input=${encodeURIComponent(input)}`,
      );
    });

    it("should skip the input when there is none", () => {
      expect(getTrpcUrl(getQuery(), "", undefined)).toBe("http://localhost:3000/trpc/user.byId");
    });

    it("should not put the mutation input in the url", () => {
      const request = createTestClient().createRequest()({ endpoint: "user.create", method: "MUTATION" });

      expect(getTrpcUrl(request, "", '{"id":1}')).toBe("http://localhost:3000/trpc/user.create");
    });

    it("should handle a trailing slash and a query string in the client url", () => {
      expect(getTrpcUrl(getQuery("http://localhost:3000/trpc/"), "", undefined)).toBe(
        "http://localhost:3000/trpc/user.byId",
      );
      expect(getTrpcUrl(getQuery("http://localhost:3000/trpc?token=1"), "", "1")).toBe(
        "http://localhost:3000/trpc/user.byId?token=1&input=1",
      );
    });

    it("should append query params without the reserved ones", () => {
      expect(getTrpcUrl(getQuery(), "?source=app&input=2&batch=1", "1")).toBe(
        "http://localhost:3000/trpc/user.byId?source=app&input=1",
      );
    });
  });

  describe("when reading the response", () => {
    it("should read the data", () => {
      expect(getTrpcResult({ result: { data: { id: 1 } } }, 200)).toStrictEqual({
        isSuccess: true,
        data: { id: 1 },
      });
    });

    it("should map a missing data to null", () => {
      expect(getTrpcResult({ result: {} }, 200)).toStrictEqual({ isSuccess: true, data: null });
    });

    it("should keep falsy data", () => {
      expect(getTrpcResult({ result: { data: 0 } }, 200)).toStrictEqual({ isSuccess: true, data: 0 });
      expect(getTrpcResult({ result: { data: false } }, 200)).toStrictEqual({ isSuccess: true, data: false });
    });

    it("should read the error", () => {
      const error = { message: "Nope", code: -32_004, data: { code: "NOT_FOUND", httpStatus: 404 } };

      expect(getTrpcResult({ error }, 404)).toStrictEqual({ isSuccess: false, error });
    });

    it("should deserialize the data and the error", () => {
      const date = new Date("2024-01-01T00:00:00.000Z");

      expect(getTrpcResult({ result: { data: superjson.serialize({ date }) } }, 200, superjson)).toStrictEqual({
        isSuccess: true,
        data: { date },
      });
      expect(getTrpcResult({ error: superjson.serialize({ date }) }, 500, superjson)).toStrictEqual({
        isSuccess: false,
        error: { date },
      });
    });

    it.each([
      ["<html>Bad gateway</html>", 502],
      ["", 200],
      [null, 200],
      [{ unknown: true }, 200],
      [{ result: { data: 1 } }, 500],
    ])("should fail for the %j body with status %s", (body, status) => {
      expect(getTrpcResult(body, status)).toStrictEqual({ isSuccess: false, error: getErrorMessage() });
    });
  });
});
