import { Client } from "@hyper-fetch/core";
import { expectType, expectNotType, expectFunctionParametersType } from "@hyper-fetch/testing";
import type { UseCacheReturnType } from "hooks/use-cache";

const client = new Client({
  url: "http://localhost:3000",
});

// ---- Request definitions ----

const getUsers = client.createRequest<{
  response: { id: string; name: string }[];
}>()({
  method: "GET",
  endpoint: "/users",
});

const getUserWithError = client.createRequest<{
  response: { id: string; name: string };
  error: { code: number; message: string };
}>()({
  method: "GET",
  endpoint: "/users/:userId",
});

// ---- Type-level tests using return type directly ----

type GetUsersReturn = UseCacheReturnType<typeof getUsers>;
type GetUserWithErrorReturn = UseCacheReturnType<typeof getUserWithError>;

describe("useCache [Types]", () => {
  describe("return type: data", () => {
    it("should type data as response type or null", () => {
      const data = null as unknown as GetUsersReturn["data"];
      expectType<{ id: string; name: string }[] | null>().assert(data);
    });

    it("should not type data as just the response type (missing null)", () => {
      const data = null as unknown as GetUsersReturn["data"];
      expectNotType<{ id: string; name: string }[]>().assert(data);
    });
  });

  describe("return type: error", () => {
    it("should type error as Error or null for default error type", () => {
      const error = null as unknown as GetUsersReturn["error"];
      expectType<Error | null>().assert(error);
    });

    it("should type error with custom error type", () => {
      const error = null as unknown as GetUserWithErrorReturn["error"];
      expectType<{ code: number; message: string } | Error | null>().assert(error);
    });
  });

  describe("return type: loading", () => {
    it("should type loading as boolean", () => {
      const loading = false as GetUsersReturn["loading"];
      expectType<boolean>().assert(loading);
    });
  });

  describe("return type: success", () => {
    it("should type success as boolean", () => {
      const success = false as GetUsersReturn["success"];
      expectType<boolean>().assert(success);
    });
  });

  describe("return type: actions", () => {
    it("should have setData accepting the response type or null", () => {
      const setData = (() => null) as unknown as GetUsersReturn["setData"];
      expectFunctionParametersType(setData).assert([[{ id: "1", name: "John" }]]);
      expectFunctionParametersType(setData).assert([null]);
    });

    it("should have setLoading accepting boolean", () => {
      const setLoading = (() => null) as unknown as GetUsersReturn["setLoading"];
      expectFunctionParametersType(setLoading).assert([true]);
    });

    it("should have setError accepting the error type or null", () => {
      const setError = (() => null) as unknown as GetUserWithErrorReturn["setError"];
      expectFunctionParametersType(setError).assert([{ code: 404, message: "Not found" }]);
      expectFunctionParametersType(setError).assert([null]);
    });
  });

  describe("return type: invalidate", () => {
    it("should have invalidate function", () => {
      const invalidate = (() => null) as unknown as GetUsersReturn["invalidate"];
      expectType<(...args: any[]) => any>().assert(invalidate);
    });

    it("should allow invalidate with no arguments", () => {
      const invalidate = (() => null) as unknown as GetUsersReturn["invalidate"];
      expectFunctionParametersType(invalidate).assert([undefined]);
    });

    it("should allow invalidate with a cache key string", () => {
      const invalidate = (() => null) as unknown as GetUsersReturn["invalidate"];
      expectFunctionParametersType(invalidate).assert(["custom-cache-key"]);
    });

    it("should allow invalidate with a regex", () => {
      const invalidate = (() => null) as unknown as GetUsersReturn["invalidate"];
      expectFunctionParametersType(invalidate).assert([/users/]);
    });
  });
});
