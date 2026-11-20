import { Client } from "@hyper-fetch/core";
import { GraphqlAdapter, GraphqlMethod } from "adapter";

const url = "https://shared-base-url/graphql";
const getUsers = "query GetUsers { users { name } }";
// Typed as a plain string: a literal would also make the adapter infer the variables from the query text
const getUser = "query GetUser($id: ID!) { user(id: $id) { name } }" as string;

/**
 * A POST body is always the JSON `{ query, variables }`, so servers that check the content type (GraphQL over HTTP
 * spec, Apollo CSRF prevention) need `application/json` even when the operation has no variables.
 */
describe("Graphql Adapter [ Headers ]", () => {
  let client = new Client({ url }).setAdapter(GraphqlAdapter());
  let fetchSpy = vi.spyOn(globalThis, "fetch");

  const getSentHeaders = () => new Headers(fetchSpy.mock.calls[0][1]?.headers);

  beforeEach(() => {
    client = new Client({ url }).setAdapter(GraphqlAdapter());
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json({ data: { users: [] } }));
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should send the JSON content type for a query without variables", async () => {
    await client.createRequest()({ endpoint: getUsers }).send();

    expect(getSentHeaders().get("content-type")).toBe("application/json");
  });

  it("should send the JSON content type for a query with variables", async () => {
    await client
      .createRequest<{ payload: { id: string } }>()({ endpoint: getUser })
      .send({ payload: { id: "1" } });

    expect(getSentHeaders().get("content-type")).toBe("application/json");
  });

  it("should not send a content type for a GET request without a body", async () => {
    await client.createRequest()({ endpoint: getUsers, method: GraphqlMethod.GET }).send();

    expect(fetchSpy.mock.calls[0][1]?.body).toBeUndefined();
    expect(getSentHeaders().has("content-type")).toBeFalse();
  });

  it("should not send a content type for a GET request with variables in the URL", async () => {
    await client
      .createRequest<{ payload: { id: string } }>()({ endpoint: getUser, method: GraphqlMethod.GET })
      .send({ payload: { id: "1" } });

    expect(String(fetchSpy.mock.calls[0][0])).toContain("variables=");
    expect(getSentHeaders().has("content-type")).toBeFalse();
  });

  it("should keep the content type given with the request", async () => {
    await client
      .createRequest()({ endpoint: getUsers, headers: { "content-type": "application/graphql-response+json" } })
      .send();

    expect(getSentHeaders().get("content-type")).toBe("application/graphql-response+json");
  });
});
