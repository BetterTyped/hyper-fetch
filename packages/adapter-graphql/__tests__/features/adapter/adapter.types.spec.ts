import type { ClientInstance, ExtractAdapterRequestOptionsType, RequestInstance } from "@hyper-fetch/core";
import { Client, HttpAdapter } from "@hyper-fetch/core";
import type {
  ExtractGqlRouteParams,
  GraphqlAdapterType,
  GraphqlDocumentTypes,
  GraphqlErrorType,
  GraphqlRequestOptionsType,
} from "adapter";
import { GraphqlAdapter } from "adapter";
import type { DocumentNode, GraphQLFormattedError } from "graphql";
import { expectTypeOf } from "vitest";

import { getUserQuery } from "../../constants/queries.constants";

type UserResponse = { username: string };

/** The decoration graphql-codegen and gql.tada add to documents - `DocumentTypeDecoration` of `@graphql-typed-document-node/core` */
type TypedDocument<Result, Variables> = DocumentNode & { __apiType?: (variables: Variables) => Result };

type GetUserResult = { user: { name: string } };
const GetUserDocument = getUserQuery as TypedDocument<GetUserResult, { id: string; active?: boolean }>;
// Codegen types an operation without variables this way
const GetUsersDocument = getUserQuery as TypedDocument<{ users: { name: string }[] }, { [key: string]: never }>;

describe("Graphql Adapter [ Types ]", () => {
  const client = new Client({ url: "https://shared-base-url/graphql" }).setAdapter(GraphqlAdapter());

  it("should expose document in the adapter request options", () => {
    expectTypeOf<ExtractAdapterRequestOptionsType<GraphqlAdapterType>>().toEqualTypeOf<GraphqlRequestOptionsType>();
    expectTypeOf<GraphqlRequestOptionsType["document"]>().toEqualTypeOf<string | DocumentNode | undefined>();
  });

  it("should accept string and DocumentNode documents", () => {
    client.createRequest()({ endpoint: "/User", document: getUserQuery });
    client.createRequest()({ endpoint: "/User", document: "query User { id }" });
    client.createRequest()({ endpoint: "query User { id }" });
    client.createRequest()({ endpoint: getUserQuery });

    expectTypeOf(client.createRequest()).parameter(0).toHaveProperty("document");
    // @ts-expect-error document has to be a string or a DocumentNode
    expectTypeOf(client.createRequest()).parameter(0).toEqualTypeOf<{ endpoint: string; document: number }>();
  });

  it("should compile the example from the proposal", () => {
    const getUser = client.createRequest<{ response: UserResponse; payload: { id: number } }>()({
      endpoint: "/User",
      document: getUserQuery,
    });

    const send = () => getUser.setQueryParams({ source: "app", build: "1.2.3" }).send({ payload: { id: 1 } });

    expectTypeOf<Awaited<ReturnType<typeof send>>["data"]>().toEqualTypeOf<UserResponse | null>();
  });

  it("should not require query params when they are not declared", () => {
    const request = client.createRequest<{ response: UserResponse }>()({ endpoint: "/User", document: getUserQuery });

    expectTypeOf(request.send).toBeCallableWith();
    expectTypeOf(request.send).toBeCallableWith({});
    request.setQueryParams("source=app");
    request.setQueryParams({ source: "app" });
  });

  it("should use the declared query params", () => {
    const request = client.createRequest<{ queryParams: { source: string } }>()({
      endpoint: "/User",
      document: getUserQuery,
    });

    request.setQueryParams({ source: "app" });
    // @ts-expect-error wrong query params
    request.setQueryParams({ source: 1 });
  });

  it("should take the params from the url path when document is set", () => {
    const request = client.createRequest()({ endpoint: "/tenant/:tenantId/User", document: getUserQuery });

    request.setParams({ tenantId: 1 });
    // @ts-expect-error unknown param
    request.setParams({ other: 1 });
  });

  it("should keep the document after using adapter mapper setters", () => {
    const adapter = GraphqlAdapter()
      .setQueryParamsMapper(() => "a=1")
      .setHeaderMapper(() => ({}))
      .setPayloadMapper(() => "")
      .setEndpointMapper(() => "/User");
    const custom = new Client({ url: "" }).setAdapter(adapter);

    custom.createRequest()({ endpoint: "/User", document: getUserQuery });

    expectTypeOf<ExtractAdapterRequestOptionsType<typeof adapter>>().toEqualTypeOf<GraphqlRequestOptionsType>();
  });

  it("should not accept document for other adapters", () => {
    const http = new Client({ url: "" }).setAdapter(HttpAdapter());

    // @ts-expect-error document is declared only by the GraphqlAdapter
    http.createRequest()({ endpoint: "/User", document: "query User { id }" });

    expectTypeOf<ExtractAdapterRequestOptionsType<ReturnType<typeof HttpAdapter>>>().toEqualTypeOf<{}>();
  });

  it("should keep the params strict for not specified adapters", () => {
    const create = (instance: ClientInstance) => {
      // @ts-expect-error endpoint is required, the unknown adapter must not turn params into any
      return instance.createRequest()({ document: "query User { id }" });
    };

    expectTypeOf(create).returns.toExtend<RequestInstance>();
  });

  it("should extract the variables from the document literal", () => {
    const USER_QUERY = "query User($id: ID!, $name: String) { user(id: $id, name: $name) { id } }";

    expectTypeOf<ExtractGqlRouteParams<typeof USER_QUERY>>().toMatchTypeOf<{ id: unknown; name?: unknown }>();

    const request = client.createRequest<{ payload: ExtractGqlRouteParams<typeof USER_QUERY> }>()({
      endpoint: "/User",
      document: USER_QUERY,
    });

    request.setPayload({ id: 1 });
    // @ts-expect-error id is required by the document
    request.setPayload({ name: "a" });
  });

  describe("when typing requests from a typed document", () => {
    it("should take the response and the variables from the document", () => {
      const request = client.createRequest<GraphqlDocumentTypes<typeof GetUserDocument>>()({
        endpoint: GetUserDocument,
      });
      const send = () => request.send({ payload: { id: "1" } });

      expectTypeOf<Awaited<ReturnType<typeof send>>["data"]>().toEqualTypeOf<GetUserResult | null>();
      request.send({ payload: { id: "1", active: true } });
      // @ts-expect-error the id variable is a string
      request.send({ payload: { id: 1 } });
      // @ts-expect-error the id variable is required
      request.send({ payload: { active: true } });
    });

    it("should not need a payload for a document without variables", () => {
      const request = client.createRequest<GraphqlDocumentTypes<typeof GetUsersDocument>>()({
        endpoint: GetUsersDocument,
      });

      expectTypeOf<GraphqlDocumentTypes<typeof GetUsersDocument>["payload"]>().toEqualTypeOf<undefined>();
      expectTypeOf(request.send).toBeCallableWith();
    });

    it("should work with the document option and other request types", () => {
      const request = client.createRequest<
        GraphqlDocumentTypes<typeof GetUserDocument> & { queryParams: { source: string } }
      >()({ endpoint: "/User", document: GetUserDocument });

      request.setQueryParams({ source: "app" });
      // @ts-expect-error wrong query params
      request.setQueryParams({ source: 1 });
      request.setPayload({ id: "1" });
      // @ts-expect-error the id variable is a string
      request.setPayload({ id: 1 });
    });
  });

  describe("when typing errors", () => {
    it("should type the response error with GraphqlErrorType", () => {
      const typed = new Client<GraphqlErrorType>({ url: "" }).setAdapter(GraphqlAdapter());
      const send = () => typed.createRequest<{ response: UserResponse }>()({ endpoint: getUserQuery }).send();

      expectTypeOf<GraphqlErrorType[number]>().toEqualTypeOf<GraphQLFormattedError | Error>();
      expectTypeOf<Awaited<ReturnType<typeof send>>["error"]>().toExtend<GraphqlErrorType | null>();
    });

    it("should type the GraphQL errors in the extra", () => {
      const send = () => client.createRequest<{ response: UserResponse }>()({ endpoint: getUserQuery }).send();

      expectTypeOf<NonNullable<Awaited<ReturnType<typeof send>>["extra"]>["errors"]>().toEqualTypeOf<
        GraphQLFormattedError[] | undefined
      >();
    });

    it("should accept only known error policies", () => {
      client.createRequest()({ endpoint: getUserQuery, options: { errorPolicy: "all" } });
      client.createRequest()({ endpoint: getUserQuery, options: { errorPolicy: "none" } });
      // @ts-expect-error unknown error policy
      client.createRequest()({ endpoint: getUserQuery, options: { errorPolicy: "ignore" } });
    });
  });
});
