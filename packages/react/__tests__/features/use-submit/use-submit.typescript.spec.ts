import {
  expectType,
  expectNotType,
  expectFunctionParametersType,
  expectNotFunctionParametersType,
} from "@hyper-fetch/testing";
import { Client, RequestSendType } from "@hyper-fetch/core";

import { UseSubmitReturnType } from "hooks/use-submit";

const client = new Client({
  url: "http://localhost:3000",
});

// ---- Request definitions ----

const postUser = client.createRequest<{
  response: { id: string; name: string };
  payload: { name: string; email: string };
}>()({
  method: "POST",
  endpoint: "/users",
});

const patchUser = client.createRequest<{
  response: { id: string; name: string };
  payload: { name?: string };
}>()({
  method: "PATCH",
  endpoint: "/users/:userId",
});

const deleteUser = client.createRequest<{
  response: void;
}>()({
  method: "DELETE",
  endpoint: "/users/:userId",
});

const postWithQuery = client.createRequest<{
  response: { id: string };
  payload: { data: string };
  queryParams: { dryRun: boolean };
}>()({
  method: "POST",
  endpoint: "/resources",
});

const postWithCustomError = client.createRequest<{
  response: { id: string };
  payload: { value: number };
  error: { code: string; message: string };
}>()({
  method: "POST",
  endpoint: "/items",
});

// ---- Type-level tests using return type directly ----

type PostUserReturn = UseSubmitReturnType<typeof postUser>;
type PostWithCustomErrorReturn = UseSubmitReturnType<typeof postWithCustomError>;

describe("useSubmit [Types]", () => {
  describe("return type: data", () => {
    it("should type data as response type or null", () => {
      const data = null as unknown as PostUserReturn["data"];
      expectType<{ id: string; name: string } | null>().assert(data);
    });

    it("should not type data as just the response type (missing null)", () => {
      const data = null as unknown as PostUserReturn["data"];
      expectNotType<{ id: string; name: string }>().assert(data);
    });

    it("should type void response correctly", () => {
      type DeleteData = UseSubmitReturnType<typeof deleteUser>["data"];
      const data = null as unknown as DeleteData;
      expectType<void | null>().assert(data);
    });
  });

  describe("return type: error", () => {
    it("should type error as Error or null for default error type", () => {
      const error = null as unknown as PostUserReturn["error"];
      expectType<Error | null>().assert(error);
    });

    it("should type error with custom error type", () => {
      const error = null as unknown as PostWithCustomErrorReturn["error"];
      expectType<{ code: string; message: string } | Error | null>().assert(error);
    });
  });

  describe("return type: submitting (not loading)", () => {
    it("should have submitting as boolean", () => {
      const submitting = false as PostUserReturn["submitting"];
      expectType<boolean>().assert(submitting);
    });
  });

  describe("return type: success", () => {
    it("should type success as boolean", () => {
      const success = false as PostUserReturn["success"];
      expectType<boolean>().assert(success);
    });
  });

  describe("submit: payload requirements", () => {
    it("should require payload in submit for requests with payload", () => {
      type SubmitType = RequestSendType<typeof postUser>;
      const submit = (() => null) as unknown as SubmitType;
      expectFunctionParametersType(submit).assert([
        {
          payload: { name: "John", email: "john@test.com" },
        },
      ]);
    });

    it("should not allow submit without payload when payload is required", () => {
      type SubmitType = RequestSendType<typeof postUser>;
      const submit = (() => null) as unknown as SubmitType;
      expectNotFunctionParametersType(submit).assert([
        {
          payload: null,
        },
      ]);
    });

    it("should allow submit without explicit payload after setPayload", () => {
      const withPayload = postUser.setPayload({ name: "John", email: "john@test.com" });
      type SubmitType = RequestSendType<typeof withPayload>;
      const submit = (() => null) as unknown as SubmitType;
      expectFunctionParametersType(submit).assert([undefined]);
    });
  });

  describe("submit: params requirements", () => {
    it("should require params in submit for requests with URL params", () => {
      type SubmitType = RequestSendType<typeof patchUser>;
      const submit = (() => null) as unknown as SubmitType;
      expectFunctionParametersType(submit).assert([
        {
          params: { userId: "1" },
          payload: { name: "John" },
        },
      ]);
    });

    it("should allow submit without params after setParams", () => {
      const withParams = patchUser.setParams({ userId: "1" });
      type SubmitType = RequestSendType<typeof withParams>;
      const submit = (() => null) as unknown as SubmitType;
      expectFunctionParametersType(submit).assert([
        {
          payload: { name: "John" },
          params: null,
        },
      ]);
    });
  });

  describe("submit: query params requirements", () => {
    it("should require queryParams in submit when defined", () => {
      type SubmitType = RequestSendType<typeof postWithQuery>;
      const submit = (() => null) as unknown as SubmitType;
      expectFunctionParametersType(submit).assert([
        {
          payload: { data: "test" },
          queryParams: { dryRun: true },
        },
      ]);
    });

    it("should not allow submit without required queryParams", () => {
      type SubmitType = RequestSendType<typeof postWithQuery>;
      const submit = (() => null) as unknown as SubmitType;
      expectNotFunctionParametersType(submit).assert([
        {
          payload: { data: "test" },
          queryParams: undefined,
        },
      ]);
    });
  });

  describe("submit: no payload/params required", () => {
    it("should allow submit without arguments for DELETE with params set", () => {
      const withParams = deleteUser.setParams({ userId: "1" });
      type SubmitType = RequestSendType<typeof withParams>;
      const submit = (() => null) as unknown as SubmitType;
      expectFunctionParametersType(submit).assert([undefined]);
    });
  });

  describe("return type: event callbacks", () => {
    it("should have onSubmitSuccess callback", () => {
      const cb = (() => null) as unknown as PostUserReturn["onSubmitSuccess"];
      expectType<(callback: any) => void>().assert(cb);
    });

    it("should have onSubmitError callback", () => {
      const cb = (() => null) as unknown as PostUserReturn["onSubmitError"];
      expectType<(callback: any) => void>().assert(cb);
    });

    it("should have onSubmitFinished callback", () => {
      const cb = (() => null) as unknown as PostUserReturn["onSubmitFinished"];
      expectType<(callback: any) => void>().assert(cb);
    });

    it("should have abort function", () => {
      const abort = (() => null) as unknown as PostUserReturn["abort"];
      expectType<() => void>().assert(abort);
    });

    it("should have onSubmitRequestStart callback", () => {
      const cb = (() => null) as unknown as PostUserReturn["onSubmitRequestStart"];
      expectType<(callback: any) => void>().assert(cb);
    });

    it("should have onSubmitResponseStart callback", () => {
      const cb = (() => null) as unknown as PostUserReturn["onSubmitResponseStart"];
      expectType<(callback: any) => void>().assert(cb);
    });
  });

  describe("return type: actions", () => {
    it("should have setData accepting the response type or null", () => {
      const setData = (() => null) as unknown as PostUserReturn["setData"];
      expectFunctionParametersType(setData).assert([{ id: "1", name: "John" }]);
      expectFunctionParametersType(setData).assert([null]);
    });

    it("should have setError accepting the error type or null", () => {
      const setError = (() => null) as unknown as PostWithCustomErrorReturn["setError"];
      expectFunctionParametersType(setError).assert([{ code: "ERR", message: "fail" }]);
      expectFunctionParametersType(setError).assert([null]);
    });
  });

  describe("return type: bounce and refetch", () => {
    it("should have bounce state with active and reset", () => {
      const bounce = {} as PostUserReturn["bounce"];
      expectType<boolean>().assert(bounce.active);
      expectType<() => void>().assert(bounce.reset);
    });

    it("should have refetch function", () => {
      const refetch = (() => null) as unknown as PostUserReturn["refetch"];
      expectType<() => void>().assert(refetch);
    });
  });
});
