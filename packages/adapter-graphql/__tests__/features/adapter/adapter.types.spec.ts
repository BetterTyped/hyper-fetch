import type { ClientInstance, ExtractAdapterRequestOptionsType, RequestInstance } from "@hyper-fetch/core";
import { Client, HttpAdapter } from "@hyper-fetch/core";
import type { ExtractGqlRouteParams, GraphqlAdapterType, GraphqlRequestOptionsType } from "adapter";
import { GraphqlAdapter } from "adapter";
import type { DocumentNode } from "graphql";
import { expectTypeOf } from "vitest";

import { getUserQuery } from "../../constants/queries.constants";

type UserResponse = { username: string };

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
});
