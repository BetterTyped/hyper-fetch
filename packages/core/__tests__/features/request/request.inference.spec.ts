import { Client } from "client";
import type { ExtractUrlParams, ParamType, RequestInstance } from "request";
import type {
  ExtractErrorType,
  ExtractParamsType,
  ExtractPayloadType,
  ExtractQueryParamsType,
  ExtractResponseType,
} from "types";

type User = { id: number; name: string };
type ApiError = { message: string; code: number };
type GlobalError = { reason: string };

/**
 * Type-level tests - they are verified by `pnpm typecheck`, the runtime assertions only keep the spec alive.
 */
describe("Request [ Type inference ]", () => {
  const client = new Client<GlobalError>({ url: "http://types" });

  const getUsers = client.createRequest<{ response: User[]; queryParams?: { page?: number } }>()({
    endpoint: "/users",
  });
  const getUser = client.createRequest<{ response: User; error: ApiError }>()({ endpoint: "/users/:userId" });
  const postUser = client.createRequest<{ response: User; payload: { name: string }; error: ApiError }>()({
    endpoint: "/users",
    method: "POST",
  });
  const patchUser = client.createRequest<{ response: User; payload: { name: string } }>()({
    endpoint: "/teams/:teamId/users/:userId",
    method: "PATCH",
  });
  const searchUsers = client.createRequest<{ response: User[]; queryParams: { search: string } }>()({
    endpoint: "/users/search",
  });

  type SendResult<T extends RequestInstance> = Awaited<ReturnType<T["send"]>>;
  type SendOptions<T extends RequestInstance> = NonNullable<Parameters<T["send"]>[0]>;

  describe("When reading the generics of a request", () => {
    it("should infer the response", () => {
      expectTypeOf<ExtractResponseType<typeof getUsers>>().toEqualTypeOf<User[]>();
      expectTypeOf<ExtractResponseType<typeof getUser>>().toEqualTypeOf<User>();
      expect(getUsers.endpoint).toBe("/users");
    });

    it("should infer the payload", () => {
      expectTypeOf<ExtractPayloadType<typeof postUser>>().toEqualTypeOf<{ name: string }>();
      expectTypeOf<ExtractPayloadType<typeof getUser>>().toEqualTypeOf<undefined>();
      expect(postUser.method).toBe("POST");
    });

    it("should join the error of the request with the global error of the client", () => {
      expectTypeOf<ExtractErrorType<typeof getUser>>().toEqualTypeOf<ApiError | GlobalError>();
      expectTypeOf<ExtractErrorType<typeof getUsers>>().toEqualTypeOf<GlobalError>();
      expect(getUser.auth).toBe(true);
    });

    it("should infer the query params", () => {
      expectTypeOf<ExtractQueryParamsType<typeof searchUsers>>().toEqualTypeOf<{ search: string }>();
      expect(searchUsers.queryParams).toBeUndefined();
    });

    it("should infer the params from the endpoint", () => {
      expectTypeOf<ExtractParamsType<typeof getUser>>().toEqualTypeOf<{ userId: ParamType }>();
      expectTypeOf<ExtractParamsType<typeof patchUser>>().toEqualTypeOf<{ teamId: ParamType; userId: ParamType }>();
      expectTypeOf<ExtractParamsType<typeof getUsers>>().toEqualTypeOf<null | undefined>();
      expect(patchUser.endpoint).toBe("/teams/:teamId/users/:userId");
    });

    it("should read the params of any endpoint literal", () => {
      expectTypeOf<ExtractUrlParams<"/a/:first/b/:second/c/:third">>().toEqualTypeOf<{
        first: ParamType;
        second: ParamType;
        third: ParamType;
      }>();
      expectTypeOf<ExtractUrlParams<":only">>().toEqualTypeOf<{ only: ParamType }>();
      expectTypeOf<ExtractUrlParams<"/static/path">>().toEqualTypeOf<null | undefined>();
      expectTypeOf<ExtractUrlParams<string>>().toEqualTypeOf<null | undefined>();
      expect(true).toBe(true);
    });

    it("should not read the colons of a GraphQL document as params", () => {
      expectTypeOf<ExtractUrlParams<"mutation D($id: ID!) { del(id: $id) }">>().toEqualTypeOf<null | undefined>();
      expectTypeOf<ExtractUrlParams<"query { user(id: 1) { name } }">>().toEqualTypeOf<null | undefined>();
      expectTypeOf<ExtractUrlParams<"query U($id: ID!) {\n  user(id: $id) { name }\n}">>().toEqualTypeOf<
        null | undefined
      >();
      expect(true).toBe(true);
    });

    it("should read only the params of an absolute url", () => {
      expectTypeOf<ExtractUrlParams<"http://localhost:3000/users/:userId">>().toEqualTypeOf<{
        userId: ParamType;
      }>();
      expectTypeOf<ExtractUrlParams<"https://api.test/:_version/items">>().toEqualTypeOf<{ _version: ParamType }>();
      expect(true).toBe(true);
    });

    it("should send a request with a GraphQL string document without params", () => {
      const deleteUser = client.createRequest<{ response: User; payload: { id: string } }>()({
        endpoint: "mutation D($id: ID!) { del(id: $id) }",
        method: "POST",
      });

      expectTypeOf<ExtractParamsType<typeof deleteUser>>().toEqualTypeOf<null | undefined>();
      expectTypeOf(deleteUser.send).toBeCallableWith({ payload: { id: "1" } });
      expect(deleteUser.endpoint).toBe("mutation D($id: ID!) { del(id: $id) }");
    });

    it("should keep the literal type of the endpoint", () => {
      expectTypeOf(getUser.requestOptions.endpoint).toEqualTypeOf<"/users/:userId">();
      expect(getUser.requestOptions.endpoint).toBe("/users/:userId");
    });
  });

  describe("When reading the result of send", () => {
    it("should give the typed data or null", () => {
      expectTypeOf<SendResult<typeof getUsers>["data"]>().toEqualTypeOf<User[] | null>();
      expectTypeOf<SendResult<typeof postUser>["data"]>().toEqualTypeOf<User | null>();
      expect(getUsers.cache).toBe(true);
    });

    it("should give the typed error or null", () => {
      expectTypeOf<SendResult<typeof getUser>["error"]>().toEqualTypeOf<ApiError | GlobalError | null>();
      expect(getUser.retry).toBe(0);
    });

    it("should give the status, the success flag and the extra of the http adapter", () => {
      expectTypeOf<SendResult<typeof getUser>["status"]>().toEqualTypeOf<number | null>();
      expectTypeOf<SendResult<typeof getUser>["success"]>().toEqualTypeOf<boolean>();
      expectTypeOf<SendResult<typeof getUser>["extra"]>().toEqualTypeOf<{ headers: Record<string, string> } | null>();
      expect(getUser.offline).toBe(true);
    });

    it("should give the same result type from exec", () => {
      expectTypeOf<Awaited<ReturnType<typeof getUser.exec>>>().toEqualTypeOf<SendResult<typeof getUser>>();
      expect(getUser.queued).toBe(false);
    });

    it("should give the response type of the response mapper", () => {
      const mapped = getUser.setResponseMapper((response) => ({
        ...response,
        data: { fullName: "John" },
        error: null,
        success: true as const,
      }));

      expectTypeOf<SendResult<typeof mapped>["data"]>().toEqualTypeOf<{ fullName: string } | null>();
      expect(mapped.unstable_responseMapper).toBeDefined();
    });
  });

  describe("When checking the arguments of send", () => {
    it("should not require anything for a request without params, payload and required query params", () => {
      expectTypeOf(getUsers.send).toBeCallableWith();
      expectTypeOf(getUsers.send).toBeCallableWith({ queryParams: { page: 1 } });
      expectTypeOf(getUsers.send).toBeCallableWith({ retry: 2, onResponse: () => {} });
      expect(getUsers.params).toBeUndefined();
    });

    it("should require the params of the endpoint", () => {
      expectTypeOf<SendOptions<typeof getUser>["params"]>().toEqualTypeOf<{ userId: ParamType }>();
      expectTypeOf(getUser.send).toBeCallableWith({ params: { userId: 1 } });
      expectTypeOf(getUser.send).toBeCallableWith({ params: { userId: "john" } });
      // @ts-expect-error params are required
      expectTypeOf(getUser.send).toBeCallableWith();
      // @ts-expect-error all the params of the endpoint are required
      expectTypeOf(patchUser.send).toBeCallableWith({ params: { userId: 1 }, payload: { name: "John" } });
      expect(getUser.params).toBeUndefined();
    });

    it("should not require the params which were already set", () => {
      const withParams = getUser.setParams({ userId: 1 });

      expectTypeOf(withParams.send).toBeCallableWith();
      expect(withParams.endpoint).toBe("/users/1");
    });

    it("should require the payload", () => {
      expectTypeOf<SendOptions<typeof postUser>["payload"]>().toEqualTypeOf<{ name: string }>();
      expectTypeOf(postUser.send).toBeCallableWith({ payload: { name: "John" } });
      // @ts-expect-error payload is required
      expectTypeOf(postUser.send).toBeCallableWith();
      // @ts-expect-error payload has to match its type
      expectTypeOf(postUser.send).toBeCallableWith({ payload: { name: 1 } });
      expect(postUser.payload).toBeUndefined();
    });

    it("should not require the payload which was already set", () => {
      const withPayload = postUser.setPayload({ name: "John" });

      expectTypeOf(withPayload.send).toBeCallableWith();
      expect(withPayload.payload).toEqual({ name: "John" });
    });

    it("should require the required query params", () => {
      expectTypeOf(searchUsers.send).toBeCallableWith({ queryParams: { search: "john" } });
      // @ts-expect-error query params are required
      expectTypeOf(searchUsers.send).toBeCallableWith();
      // @ts-expect-error query params have to match their type
      expectTypeOf(searchUsers.send).toBeCallableWith({ queryParams: { search: 1 } });
      expect(searchUsers.endpoint).toBe("/users/search");
    });

    it("should not require the query params which were already set", () => {
      const withQueryParams = searchUsers.setQueryParams({ search: "john" });

      expectTypeOf(withQueryParams.send).toBeCallableWith();
      expect(withQueryParams.queryParams).toEqual({ search: "john" });
    });

    it("should require everything that is still missing", () => {
      const withParams = patchUser.setParams({ teamId: 1, userId: 2 });

      expectTypeOf(patchUser.send).toBeCallableWith({ params: { teamId: 1, userId: 2 }, payload: { name: "John" } });
      expectTypeOf(withParams.send).toBeCallableWith({ payload: { name: "John" } });
      expectTypeOf(withParams.setPayload({ name: "John" }).send).toBeCallableWith();
      // @ts-expect-error payload is still required
      expectTypeOf(withParams.send).toBeCallableWith();
      expect(withParams.endpoint).toBe("/teams/1/users/2");
    });
  });

  describe("When checking the arguments of the setters", () => {
    it("should accept only the params of the endpoint", () => {
      // @ts-expect-error unknown param
      getUser.setParams({ id: 1 });
      // @ts-expect-error missing param
      patchUser.setParams({ userId: 1 });
      expect(getUser.setParams({ userId: 1 }).params).toEqual({ userId: 1 });
    });

    it("should accept only the payload of the request", () => {
      // @ts-expect-error wrong payload
      postUser.setPayload({ title: "John" });
      // @ts-expect-error wrong type of the value
      postUser.setPayload({ name: 1 });
      expect(postUser.setPayload({ name: "John" }).payload).toEqual({ name: "John" });
    });

    it("should accept only the methods of the adapter", () => {
      client.createRequest()({ endpoint: "/methods", method: "DELETE" });
      // @ts-expect-error unknown method
      client.createRequest()({ endpoint: "/methods", method: "FETCH" });
      expect(client.adapter.defaultMethod).toBe("GET");
    });

    it("should accept only the options of the adapter", () => {
      expectTypeOf(getUser.setOptions).toBeCallableWith({ timeout: 1000, credentials: "include" });
      // @ts-expect-error unknown option
      expectTypeOf(getUser.setOptions).toBeCallableWith({ unknownOption: true });
      expect(getUser.options).toBeUndefined();
    });
  });

  describe("When using the callbacks", () => {
    it("should give the typed response to the onResponse callback", () => {
      type OnResponse = NonNullable<SendOptions<typeof postUser>["onResponse"]>;
      type Event = Parameters<OnResponse>[0];

      expectTypeOf<Event["response"]["data"]>().toEqualTypeOf<User | null>();
      expectTypeOf<Event["requestId"]>().toEqualTypeOf<string>();
      expectTypeOf<Event["details"]["retries"]>().toEqualTypeOf<number>();
      expect(postUser.retryTime).toBe(500);
    });

    it("should give the context of the optimistic callback to the callbacks", () => {
      type OnResponse = NonNullable<SendOptions<typeof postUser>["onResponse"]>;
      type OnBeforeSent = NonNullable<SendOptions<typeof postUser>["onBeforeSent"]>;

      expectTypeOf<Parameters<OnResponse>[0]>().toHaveProperty("mutationContext");
      expectTypeOf<Parameters<OnBeforeSent>[0]>().toHaveProperty("mutationContext");
      expect(postUser.optimistic).toBeUndefined();
    });

    it("should give the progress values to the progress callbacks", () => {
      type OnUploadProgress = NonNullable<SendOptions<typeof postUser>["onUploadProgress"]>;
      type Event = Parameters<OnUploadProgress>[0];

      expectTypeOf<Event["progress"]>().toEqualTypeOf<number>();
      expectTypeOf<Event["loaded"]>().toEqualTypeOf<number>();
      expectTypeOf<Event["total"]>().toEqualTypeOf<number>();
      expectTypeOf<Event["timeLeft"]>().toEqualTypeOf<number | null>();
      expect(postUser.cancelable).toBe(false);
    });

    it("should give the typed response to the retryOnError callback", () => {
      const withCallback = getUser.setRetryOnError((response) => {
        expectTypeOf(response.error).toEqualTypeOf<ApiError | GlobalError | null>();
        return response.status === 503;
      });

      expect(withCallback.retryOnError).toBeDefined();
    });
  });

  describe("When the endpoint carries its types", () => {
    /** The decoration graphql-codegen and gql.tada put on documents, here on a REST path */
    type TypedEndpoint<Response, Payload> = string & { __apiType?: (payload: Payload) => Response };

    const createUser = "/users" as TypedEndpoint<User, { name: string }>;
    const listUsers = "/users" as TypedEndpoint<User[], { [key: string]: never }>;

    it("should take the response and the payload from the endpoint", () => {
      const request = client.createRequest()({ endpoint: createUser, method: "POST" });

      expectTypeOf<ExtractResponseType<typeof request>>().toEqualTypeOf<User>();
      expectTypeOf<ExtractPayloadType<typeof request>>().toEqualTypeOf<{ name: string }>();
      request.send({ payload: { name: "Ann" } });
      // @ts-expect-error the payload comes from the endpoint
      request.send({ payload: { name: 1 } });
    });

    it("should not need a payload for an endpoint without one", () => {
      const request = client.createRequest()({ endpoint: listUsers });

      expectTypeOf<ExtractPayloadType<typeof request>>().toEqualTypeOf<undefined>();
      expectTypeOf(request.send).toBeCallableWith();
    });

    it("should let the declared generics win over the endpoint", () => {
      const request = client.createRequest<{ response: { id: number } }>()({ endpoint: createUser, method: "POST" });

      expectTypeOf<ExtractResponseType<typeof request>>().toEqualTypeOf<{ id: number }>();
      expectTypeOf<ExtractPayloadType<typeof request>>().toEqualTypeOf<{ name: string }>();
    });

    it("should combine the endpoint types with the other declared generics", () => {
      const request = client.createRequest<{ error: ApiError; queryParams: { page: number } }>()({
        endpoint: createUser,
        method: "POST",
      });

      expectTypeOf<ExtractResponseType<typeof request>>().toEqualTypeOf<User>();
      expectTypeOf<ExtractErrorType<typeof request>>().toEqualTypeOf<ApiError | GlobalError>();
      expectTypeOf<ExtractQueryParamsType<typeof request>>().toEqualTypeOf<{ page: number }>();
    });

    it("should keep undefined types for endpoints without the decoration", () => {
      const request = client.createRequest()({ endpoint: "/users" });

      expectTypeOf<ExtractResponseType<typeof request>>().toEqualTypeOf<undefined>();
      expectTypeOf<ExtractPayloadType<typeof request>>().toEqualTypeOf<undefined>();
    });
  });
});
