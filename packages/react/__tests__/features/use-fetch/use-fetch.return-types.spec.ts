import type { Client, ExtractAdapterExtraType, ExtractAdapterType } from "@hyper-fetch/core";
import type { UseCacheReturnType } from "hooks/use-cache";
import type { UseFetchOptionsType, UseFetchReturnType } from "hooks/use-fetch";
import { useFetch } from "hooks/use-fetch";
import { expectTypeOf } from "vitest";

import { client } from "../../utils";

type User = { id: number; name: string; tags: string[] };
type ApiError = { code: string; message: string };

const getUser = client.createRequest<{ response: User; error: ApiError }>()({ endpoint: "/users/:userId" });
const getUsers = client.createRequest<{ response: User[]; queryParams: { page: number } }>()({ endpoint: "/users" });
const getPlain = client.createRequest<{ response: string }>()({ endpoint: "/plain" });

const userRequest = getUser.setParams({ userId: 1 });

type UserRequest = typeof userRequest;
type UserState = UseFetchReturnType<UserRequest>;

/**
 * Type level tests - nothing is rendered, hooks are referenced only inside of never called functions
 */
describe("useFetch [ Return Types ]", () => {
  describe("state", () => {
    it("should type data as the response or null", () => {
      expectTypeOf<UserState["data"]>().toEqualTypeOf<User | null>();
      expectTypeOf<UseFetchReturnType<typeof getUsers>["data"]>().toEqualTypeOf<User[] | null>();
      expectTypeOf<UseFetchReturnType<typeof getPlain>["data"]>().toEqualTypeOf<string | null>();
    });
    it("should type error as the request error union or null", () => {
      expectTypeOf<UserState["error"]>().toEqualTypeOf<ApiError | Error | null>();
      expectTypeOf<UseFetchReturnType<typeof getPlain>["error"]>().toEqualTypeOf<Error | null>();
    });
    it("should type the flags, counters and timestamps", () => {
      expectTypeOf<UserState["loading"]>().toEqualTypeOf<boolean>();
      expectTypeOf<UserState["success"]>().toEqualTypeOf<boolean>();
      expectTypeOf<UserState["retries"]>().toEqualTypeOf<number>();
      expectTypeOf<UserState["responseTimestamp"]>().toEqualTypeOf<Date | null>();
      expectTypeOf<UserState["requestTimestamp"]>().toEqualTypeOf<Date | null>();
    });
    it("should type status and extra with the adapter types", () => {
      expectTypeOf<UserState["status"]>().toEqualTypeOf<number | null>();
      expectTypeOf<UserState["extra"]>().toEqualTypeOf<ExtractAdapterExtraType<
        ExtractAdapterType<UserRequest>
      > | null>();
    });
    it("should not allow to read unknown fields", () => {
      expectTypeOf<UserState>().not.toHaveProperty("isLoading");
      expectTypeOf<UserState>().not.toHaveProperty("submit");
      expectTypeOf<UserState>().not.toHaveProperty("invalidate");
    });
  });

  describe("actions", () => {
    it("should type the functions without arguments", () => {
      expectTypeOf<UserState["refetch"]>().toEqualTypeOf<() => void>();
      expectTypeOf<UserState["abort"]>().toEqualTypeOf<() => void>();
      expectTypeOf<UserState["clearState"]>().toEqualTypeOf<() => void>();
    });
    it("should type setData with the response, null and the updater", () => {
      expectTypeOf<UserState["setData"]>().toBeCallableWith({ id: 1, name: "name", tags: [] });
      expectTypeOf<UserState["setData"]>().toBeCallableWith(null);
      expectTypeOf<UserState["setData"]>().toBeCallableWith((previous: User | null) => previous);
      expectTypeOf<UserState["setData"]>().parameter(0).not.toEqualTypeOf<string>();
    });
    it("should type setError with the request error", () => {
      expectTypeOf<UserState["setError"]>().toBeCallableWith({ code: "E", message: "m" });
      expectTypeOf<UserState["setError"]>().toBeCallableWith(new Error("error"));
      expectTypeOf<UserState["setError"]>().toBeCallableWith(null);
    });
    it("should type the bounce state", () => {
      expectTypeOf<UserState["bounce"]>().toEqualTypeOf<{ active: boolean; reset: () => void }>();
    });
  });

  describe("callbacks", () => {
    it("should pass the success response to onSuccess", () => {
      type Params = Parameters<Parameters<UserState["onSuccess"]>[0]>[0];

      expectTypeOf<Params["response"]["data"]>().toEqualTypeOf<User>();
      expectTypeOf<Params["response"]["error"]>().toEqualTypeOf<null>();
      expectTypeOf<Params["response"]["success"]>().toEqualTypeOf<true>();
      expectTypeOf<Params["requestId"]>().toEqualTypeOf<string>();
    });
    it("should pass the error response to onError", () => {
      type Params = Parameters<Parameters<UserState["onError"]>[0]>[0];

      expectTypeOf<Params["response"]["data"]>().toEqualTypeOf<null>();
      expectTypeOf<Params["response"]["error"]>().toEqualTypeOf<ApiError | Error>();
      expectTypeOf<Params["response"]["success"]>().toEqualTypeOf<false>();
    });
    it("should pass any response to onFinished", () => {
      type Params = Parameters<Parameters<UserState["onFinished"]>[0]>[0];

      expectTypeOf<Params["response"]["data"]>().toEqualTypeOf<User | null>();
      expectTypeOf<Params["response"]["error"]>().toEqualTypeOf<ApiError | Error | null>();
      expectTypeOf<Params["details"]["retries"]>().toEqualTypeOf<number>();
      expectTypeOf<Params["details"]["willRetry"]>().toEqualTypeOf<boolean>();
    });
  });

  describe("select", () => {
    it("should type data with the selector result", () => {
      const useName = () => useFetch(getUser.setParams({ userId: 1 }), { select: (user) => user.name });
      const useTags = () => useFetch(getUser.setParams({ userId: 1 }), { select: (user) => user.tags.length });

      expectTypeOf<ReturnType<typeof useName>["data"]>().toEqualTypeOf<string | null>();
      expectTypeOf<ReturnType<typeof useTags>["data"]>().toEqualTypeOf<number | null>();
    });
    it("should type setData with the selected data", () => {
      const useName = () => useFetch(getUser.setParams({ userId: 1 }), { select: (user) => user.name });

      expectTypeOf<ReturnType<typeof useName>["setData"]>().toBeCallableWith("name");
      expectTypeOf<ReturnType<typeof useName>["setData"]>().parameter(0).not.toEqualTypeOf<User | null>();
    });
    it("should keep the full response in the callbacks", () => {
      const useName = () => useFetch(getUser.setParams({ userId: 1 }), { select: (user) => user.name });
      type Params = Parameters<Parameters<ReturnType<typeof useName>["onSuccess"]>[0]>[0];

      expectTypeOf<Params["response"]["data"]>().toEqualTypeOf<User>();
    });
    it("should pass the response to the selector", () => {
      type Select = NonNullable<UseFetchOptionsType<UserRequest, string>["select"]>;

      expectTypeOf<Parameters<Select>[0]>().toEqualTypeOf<User>();
      expectTypeOf<ReturnType<Select>>().toEqualTypeOf<string>();
    });
  });

  describe("options", () => {
    it("should type the initial response with the request types", () => {
      type InitialResponse = NonNullable<UseFetchOptionsType<UserRequest>["initialResponse"]>;

      expectTypeOf<InitialResponse["data"]>().toEqualTypeOf<User | null | undefined>();
      expectTypeOf<InitialResponse["error"]>().toEqualTypeOf<ApiError | Error | null | undefined>();
    });
    it("should type the modes and flags", () => {
      type Options = UseFetchOptionsType<UserRequest>;

      expectTypeOf<Options["keepPreviousData"]>().toEqualTypeOf<"auto" | "preserve" | "clean" | undefined>();
      expectTypeOf<Options["disabled"]>().toEqualTypeOf<boolean | undefined>();
      expectTypeOf<Options["suspense"]>().toEqualTypeOf<boolean | undefined>();
      expectTypeOf<Options["refreshTime"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<Options["bounceType"]>().toEqualTypeOf<"debounce" | "throttle" | undefined>();
    });
    it("should allow the bounce timeout only in the throttle mode", () => {
      expectTypeOf<{ bounceType: "throttle"; bounceTimeout: number }>().toExtend<UseFetchOptionsType<UserRequest>>();
      expectTypeOf<{ bounceType: "debounce"; bounceTimeout: number }>().not.toExtend<
        UseFetchOptionsType<UserRequest>
      >();
    });
    it("should type the throwOnError predicate with the request error", () => {
      type ThrowOnError = Exclude<UseFetchOptionsType<UserRequest>["throwOnError"], boolean | undefined>;

      expectTypeOf<Parameters<ThrowOnError>[0]>().toEqualTypeOf<ApiError | Error>();
    });
  });

  describe("request", () => {
    it("should accept the request with the params set", () => {
      const useUser = () => useFetch(getUser.setParams({ userId: 1 }));

      expectTypeOf<ReturnType<typeof useUser>["data"]>().toEqualTypeOf<User | null>();
    });
    it("should require the declared params", () => {
      const withParams = () => getUser.setParams({ userId: 1 });
      // @ts-expect-error - params of the endpoint have to be used
      const withWrongParams = () => getUser.setParams({ id: 1 });

      expectTypeOf(withParams).returns.toHaveProperty("params");
      expectTypeOf(withWrongParams).toBeFunction();
    });
    it("should require the declared query params", () => {
      expectTypeOf(getUsers.setQueryParams).parameter(0).toEqualTypeOf<{ page: number }>();
    });
    it("should share the state types with useCache", () => {
      expectTypeOf<UseCacheReturnType<UserRequest>["data"]>().toEqualTypeOf<UserState["data"]>();
      expectTypeOf<UseCacheReturnType<UserRequest>["error"]>().toEqualTypeOf<UserState["error"]>();
      expectTypeOf<UseCacheReturnType<UserRequest>>().not.toHaveProperty("refetch");
    });
    it("should use the client of the request", () => {
      expectTypeOf(getUser.client).toExtend<Client>();
    });
  });
});
