import type { ExtractAdapterResolvedType, RequestSendType } from "@hyper-fetch/core";
import { Client } from "@hyper-fetch/core";
import type { UseSubmitReturnType } from "hooks/use-submit";
import { useSubmit } from "hooks/use-submit";
import { expectTypeOf } from "vitest";

type User = { id: number; name: string };
type ApiError = { code: string; message: string };

const client = new Client({ url: "http://localhost:3000" });

const createUser = client.createRequest<{ response: User; payload: { name: string }; error: ApiError }>()({
  method: "POST",
  endpoint: "/users",
});

const renameUser = client.createRequest<{ response: User; payload: { name: string } }>()({
  method: "PATCH",
  endpoint: "/teams/:teamId/users/:userId",
});

const deleteUser = client.createRequest<{ response: null }>()({
  method: "DELETE",
  endpoint: "/users/:userId",
});

const importUsers = client.createRequest<{ response: User[]; queryParams: { dryRun: boolean } }>()({
  method: "POST",
  endpoint: "/users/import",
});

const pingServer = client.createRequest<{ response: { ok: boolean } }>()({
  method: "POST",
  endpoint: "/ping",
});

/** Only the types matter in this file - the submit functions are never called */
const getSubmit = <Request extends Parameters<typeof useSubmit>[0]>() =>
  null as unknown as UseSubmitReturnType<Request>["submit"];

describe("useSubmit [ Submit types ]", () => {
  describe("submit arguments", () => {
    it("should require the payload", () => {
      const submit = getSubmit<typeof createUser>();

      expectTypeOf(submit).parameter(0).toHaveProperty("payload").toEqualTypeOf<{ name: string }>();
      // @ts-expect-error - payload is required
      expectTypeOf(submit).toBeCallableWith();
      // @ts-expect-error - payload is required
      expectTypeOf(submit).toBeCallableWith({});
      expectTypeOf(submit).toBeCallableWith({ payload: { name: "Maciej" } });
    });
    it("should reject a payload of a wrong shape", () => {
      const submit = getSubmit<typeof createUser>();

      // @ts-expect-error - name has to be a string
      expectTypeOf(submit).toBeCallableWith({ payload: { name: 1 } });
      // @ts-expect-error - name is missing
      expectTypeOf(submit).toBeCallableWith({ payload: {} });
    });
    it("should require the params of the endpoint", () => {
      const submit = getSubmit<typeof deleteUser>();

      expectTypeOf(submit).toBeCallableWith({ params: { userId: 1 } });
      expectTypeOf(submit).toBeCallableWith({ params: { userId: "1" } });
      // @ts-expect-error - params are required
      expectTypeOf(submit).toBeCallableWith();
      // @ts-expect-error - userId is missing
      expectTypeOf(submit).toBeCallableWith({ params: {} });
    });
    it("should require every param together with the payload", () => {
      const submit = getSubmit<typeof renameUser>();

      expectTypeOf(submit).toBeCallableWith({ payload: { name: "Maciej" }, params: { teamId: 1, userId: 2 } });
      // @ts-expect-error - params are missing
      expectTypeOf(submit).toBeCallableWith({ payload: { name: "Maciej" } });
      // @ts-expect-error - payload is missing
      expectTypeOf(submit).toBeCallableWith({ params: { teamId: 1, userId: 2 } });
      // @ts-expect-error - teamId is missing
      expectTypeOf(submit).toBeCallableWith({ payload: { name: "Maciej" }, params: { userId: 2 } });
    });
    it("should require the declared query params", () => {
      const submit = getSubmit<typeof importUsers>();

      expectTypeOf(submit).toBeCallableWith({ queryParams: { dryRun: true } });
      // @ts-expect-error - query params are required
      expectTypeOf(submit).toBeCallableWith();
      // @ts-expect-error - dryRun has to be a boolean
      expectTypeOf(submit).toBeCallableWith({ queryParams: { dryRun: "yes" } });
    });
    it("should not require any argument when the request needs no data", () => {
      const submit = getSubmit<typeof pingServer>();

      expectTypeOf(submit).toBeCallableWith();
      expectTypeOf(submit).toBeCallableWith({});
    });
    it("should not require the data that is already set on the request", () => {
      const withParams = renameUser.setParams({ teamId: 1, userId: 2 });
      const withAll = withParams.setPayload({ name: "Maciej" });
      const submitWithParams = getSubmit<typeof withParams>();
      const submitWithAll = getSubmit<typeof withAll>();

      expectTypeOf(submitWithParams).toBeCallableWith({ payload: { name: "Maciej" } });
      // @ts-expect-error - payload is still required
      expectTypeOf(submitWithParams).toBeCallableWith();
      expectTypeOf(submitWithAll).toBeCallableWith();
    });
    it("should accept the lifecycle callbacks next to the data", () => {
      const submit = getSubmit<typeof createUser>();

      expectTypeOf(submit).toBeCallableWith({
        payload: { name: "Maciej" },
        onBeforeSent: ({ requestId }) => requestId,
        onResponse: ({ response }) => response.data,
      });
    });
    it("should have the same signature as the send method of the request", () => {
      expectTypeOf<UseSubmitReturnType<typeof createUser>["submit"]>().toEqualTypeOf<
        RequestSendType<typeof createUser>
      >();
      expectTypeOf<UseSubmitReturnType<typeof deleteUser>["submit"]>().toEqualTypeOf<
        RequestSendType<typeof deleteUser>
      >();
    });
  });

  describe("submit result", () => {
    it("should return a promise of the response", () => {
      const submit = getSubmit<typeof createUser>();

      expectTypeOf(submit).returns.toEqualTypeOf<Promise<ExtractAdapterResolvedType<typeof createUser>>>();
    });
    it("should type the data and the error of the response", () => {
      const submit = getSubmit<typeof createUser>();
      type Result = Awaited<ReturnType<typeof submit>>;

      expectTypeOf<Result["data"]>().toEqualTypeOf<User | null>();
      expectTypeOf<Result["error"]>().toEqualTypeOf<ApiError | Error | null>();
      expectTypeOf<Result["success"]>().toEqualTypeOf<boolean>();
      expectTypeOf<Result["requestTimestamp"]>().toEqualTypeOf<number>();
      expectTypeOf<Result["responseTimestamp"]>().toEqualTypeOf<number>();
    });
    it("should keep the full response in the result when the hook selects the data", () => {
      const useSelected = () => useSubmit(createUser, { select: (user) => user.name });
      type Selected = ReturnType<typeof useSelected>;

      expectTypeOf<Selected["data"]>().toEqualTypeOf<string | null>();
      expectTypeOf<Awaited<ReturnType<Selected["submit"]>>["data"]>().toEqualTypeOf<User | null>();
    });
  });

  describe("returned state", () => {
    type Result = UseSubmitReturnType<typeof createUser>;

    it("should type the state values", () => {
      expectTypeOf<Result["data"]>().toEqualTypeOf<User | null>();
      expectTypeOf<Result["error"]>().toEqualTypeOf<ApiError | Error | null>();
      expectTypeOf<Result["submitting"]>().toEqualTypeOf<boolean>();
      expectTypeOf<Result["success"]>().toEqualTypeOf<boolean>();
      expectTypeOf<Result["retries"]>().toEqualTypeOf<number>();
      expectTypeOf<Result["requestTimestamp"]>().toEqualTypeOf<Date | null>();
      expectTypeOf<Result["responseTimestamp"]>().toEqualTypeOf<Date | null>();
    });
    it("should expose submitting instead of loading", () => {
      expectTypeOf<Result>().toHaveProperty("submitting");
      expectTypeOf<Result>().not.toHaveProperty("loading");
    });
    it("should type the helpers", () => {
      expectTypeOf<Result["abort"]>().toEqualTypeOf<() => void>();
      expectTypeOf<Result["refetch"]>().toEqualTypeOf<() => void>();
      expectTypeOf<Result["bounce"]>().toEqualTypeOf<{ active: boolean; reset: () => void }>();
    });
    it("should pass a single typed object to the callbacks", () => {
      type SuccessParams = Parameters<Parameters<Result["onSubmitSuccess"]>[0]>;
      type ErrorParams = Parameters<Parameters<Result["onSubmitError"]>[0]>;
      type FinishedParams = Parameters<Parameters<Result["onSubmitFinished"]>[0]>;

      expectTypeOf<SuccessParams["length"]>().toEqualTypeOf<1>();
      expectTypeOf<SuccessParams[0]["response"]["data"]>().toEqualTypeOf<User>();
      expectTypeOf<SuccessParams[0]["requestId"]>().toEqualTypeOf<string>();
      expectTypeOf<ErrorParams[0]["response"]["error"]>().toEqualTypeOf<ApiError | Error>();
      expectTypeOf<ErrorParams[0]["response"]["data"]>().toEqualTypeOf<null>();
      expectTypeOf<FinishedParams[0]["response"]["data"]>().toEqualTypeOf<User | null>();
      expectTypeOf<FinishedParams[0]["details"]["willRetry"]>().toEqualTypeOf<boolean>();
    });
    it("should type the mutation context of an optimistic request", () => {
      const optimistic = createUser.setOptimistic(() => ({ context: { previous: [] as User[] } }));
      type OptimisticResult = UseSubmitReturnType<typeof optimistic>;
      type AbortParams = Parameters<Parameters<OptimisticResult["onSubmitAbort"]>[0]>[0];

      expectTypeOf<AbortParams["mutationContext"]>().toEqualTypeOf<{ previous: User[] } | undefined>();
    });
  });
});
