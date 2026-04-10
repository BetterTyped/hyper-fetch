import { expectType, expectNotType, expectFunctionParametersType } from "@hyper-fetch/testing";
import { Client } from "@hyper-fetch/core";

import { UseFetchReturnType } from "hooks/use-fetch";

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

const getUser = client.createRequest<{
  response: { id: string; name: string; email: string };
}>()({
  method: "GET",
  endpoint: "/users/:userId",
});

const getUserWithQuery = client.createRequest<{
  response: { id: string; name: string }[];
  queryParams: { search: string; page: number };
}>()({
  method: "GET",
  endpoint: "/users",
});

const getUserWithError = client.createRequest<{
  response: { id: string };
  error: { code: number; message: string; details: string[] };
}>()({
  method: "GET",
  endpoint: "/users/:userId",
});

// ---- Type-level tests using return type directly ----

type GetUsersReturn = UseFetchReturnType<typeof getUsers>;
type GetUserReturn = UseFetchReturnType<typeof getUser>;
type GetUserWithErrorReturn = UseFetchReturnType<typeof getUserWithError>;

describe("useFetch [Types]", () => {
  describe("return type: data", () => {
    it("should type data as response type or null", () => {
      const data = null as unknown as GetUsersReturn["data"];
      expectType<{ id: string; name: string }[] | null>().assert(data);
    });

    it("should not type data as just the response type (missing null)", () => {
      const data = null as unknown as GetUsersReturn["data"];
      expectNotType<{ id: string; name: string }[]>().assert(data);
    });

    it("should type data correctly for parameterized requests", () => {
      const data = null as unknown as GetUserReturn["data"];
      expectType<{ id: string; name: string; email: string } | null>().assert(data);
    });
  });

  describe("return type: error", () => {
    it("should type error as Error or null for default error type", () => {
      const error = null as unknown as GetUsersReturn["error"];
      expectType<Error | null>().assert(error);
    });

    it("should type error with custom error type", () => {
      const error = null as unknown as GetUserWithErrorReturn["error"];
      expectType<{ code: number; message: string; details: string[] } | null>().assert(error);
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

  describe("return type: retries", () => {
    it("should type retries as number", () => {
      const retries = 0 as GetUsersReturn["retries"];
      expectType<number>().assert(retries);
    });
  });

  describe("return type: timestamps", () => {
    it("should type responseTimestamp as Date or null", () => {
      const ts = null as unknown as GetUsersReturn["responseTimestamp"];
      expectType<Date | null>().assert(ts);
    });

    it("should type requestTimestamp as Date or null", () => {
      const ts = null as unknown as GetUsersReturn["requestTimestamp"];
      expectType<Date | null>().assert(ts);
    });
  });

  describe("return type: actions", () => {
    it("should have setData accepting the response type", () => {
      const setData = (() => null) as unknown as GetUsersReturn["setData"];
      expectFunctionParametersType(setData).assert([
        [{ id: "1", name: "test" }],
      ]);
    });

    it("should have setData accepting null", () => {
      const setData = (() => null) as unknown as GetUsersReturn["setData"];
      expectFunctionParametersType(setData).assert([null]);
    });

    it("should have setLoading accepting boolean", () => {
      const setLoading = (() => null) as unknown as GetUsersReturn["setLoading"];
      expectFunctionParametersType(setLoading).assert([true]);
      expectFunctionParametersType(setLoading).assert([false]);
    });

    it("should have setError accepting the error type or null", () => {
      const setError = (() => null) as unknown as GetUserWithErrorReturn["setError"];
      expectFunctionParametersType(setError).assert([
        { code: 400, message: "Bad Request", details: ["field is required"] },
      ]);
      expectFunctionParametersType(setError).assert([null]);
    });
  });

  describe("return type: event callbacks", () => {
    it("should have onSuccess callback", () => {
      const onSuccess = (() => null) as unknown as GetUsersReturn["onSuccess"];
      expectType<(callback: any) => void>().assert(onSuccess);
    });

    it("should have onError callback", () => {
      const onError = (() => null) as unknown as GetUsersReturn["onError"];
      expectType<(callback: any) => void>().assert(onError);
    });

    it("should have onFinished callback", () => {
      const onFinished = (() => null) as unknown as GetUsersReturn["onFinished"];
      expectType<(callback: any) => void>().assert(onFinished);
    });

    it("should have abort function", () => {
      const abort = (() => null) as unknown as GetUsersReturn["abort"];
      expectType<() => void>().assert(abort);
    });

    it("should have onRequestStart callback", () => {
      const onRequestStart = (() => null) as unknown as GetUsersReturn["onRequestStart"];
      expectType<(callback: any) => void>().assert(onRequestStart);
    });

    it("should have onResponseStart callback", () => {
      const onResponseStart = (() => null) as unknown as GetUsersReturn["onResponseStart"];
      expectType<(callback: any) => void>().assert(onResponseStart);
    });
  });

  describe("return type: refetch and bounce", () => {
    it("should have refetch function", () => {
      const refetch = (() => null) as unknown as GetUsersReturn["refetch"];
      expectType<() => void>().assert(refetch);
    });

    it("should have bounce state with active and reset", () => {
      const bounce = {} as GetUsersReturn["bounce"];
      expectType<boolean>().assert(bounce.active);
      expectType<() => void>().assert(bounce.reset);
    });
  });
});
