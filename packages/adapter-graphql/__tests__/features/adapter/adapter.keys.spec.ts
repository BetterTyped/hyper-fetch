import type { RequestInstance } from "@hyper-fetch/core";
import { Client } from "@hyper-fetch/core";
import { GraphqlAdapter, GraphqlMethod, matchGqlOperation } from "adapter";
import gql from "graphql-tag";

const url = "https://shared-base-url/graphql";

type UserResponse = { user: { name?: string; email?: string } };

/**
 * Two documents can share the operation name, or the root field when they are anonymous, and still select other
 * fields. They are other queries: sharing a cache entry would hand one component the data shaped for another.
 */
describe("Graphql Adapter [ Keys ]", () => {
  // The cache is only kept in the "client" mode
  const createClient = () => new Client({ url, mode: "client" }).setAdapter(GraphqlAdapter());

  let client = createClient();
  let fetchSpy = vi.spyOn(globalThis, "fetch");

  /** Answer with the fields the sent document selects */
  const answerWithSelectedFields = () => {
    fetchSpy.mockImplementation(async (_input, init) => {
      const { query } = JSON.parse(String(init?.body));
      const user = String(query).includes("email") ? { email: "ann@example.com" } : { name: "Ann" };
      return Response.json({ data: { user } });
    });
  };

  beforeEach(() => {
    client = createClient();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it.each([
    ["named operations", "query GetUser { user { name } }", "query GetUser { user { email } }"],
    ["anonymous operations", "{ user { name } }", "{ user { email } }"],
  ])("should give %s with other selections their own keys", (_name, withName, withEmail) => {
    const first = client.createRequest<{ response: UserResponse }>()({ endpoint: withName });
    const second = client.createRequest<{ response: UserResponse }>()({ endpoint: withEmail });

    expect(first.cacheKey).not.toBe(second.cacheKey);
    expect(first.queryKey).not.toBe(second.queryKey);
  });

  it("should give DocumentNodes with other selections their own keys", () => {
    const first = client.createRequest<{ response: UserResponse }>()({
      endpoint: gql`
        query GetUser {
          user {
            name
          }
        }
      `,
    });
    const second = client.createRequest<{ response: UserResponse }>()({
      endpoint: gql`
        query GetUser {
          user {
            email
          }
        }
      `,
    });

    expect(first.cacheKey).not.toBe(second.cacheKey);
  });

  it("should give the same document passed by the document option and other paths their own keys", () => {
    const document = "query GetUser { user { name } }";
    const first = client.createRequest<{ response: UserResponse }>()({ endpoint: "/a", document });
    const second = client.createRequest<{ response: UserResponse }>()({
      endpoint: "/a",
      document: "{ user { email } }",
    });

    expect(first.cacheKey).not.toBe(second.cacheKey);
  });

  it("should keep the data of each document in its own cache entry", async () => {
    answerWithSelectedFields();
    const withName = client.createRequest<{ response: UserResponse }>()({
      endpoint: "query GetUser { user { name } }",
    });
    const withEmail = client.createRequest<{ response: UserResponse }>()({
      endpoint: "query GetUser { user { email } }",
    });

    await withName.send();
    await withEmail.send();

    expect(client.cache.get(withName.cacheKey)?.data).toEqual({ user: { name: "Ann" } });
    expect(client.cache.get(withEmail.cacheKey)?.data).toEqual({ user: { email: "ann@example.com" } });
  });

  it("should not deduplicate documents with other selections into one request", async () => {
    answerWithSelectedFields();
    const withName = client
      .createRequest<{ response: UserResponse }>()({ endpoint: "query GetUser { user { name } }" })
      .setDeduplicate(true);
    const withEmail = client
      .createRequest<{ response: UserResponse }>()({ endpoint: "query GetUser { user { email } }" })
      .setDeduplicate(true);

    const [first, second] = await Promise.all([withName.send(), withEmail.send()]);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(first.data).toEqual({ user: { name: "Ann" } });
    expect(second.data).toEqual({ user: { email: "ann@example.com" } });
  });

  it("should give the same document the same keys", () => {
    const document = "query GetUser { user { name } }";

    expect(client.createRequest()({ endpoint: document }).cacheKey).toBe(
      client.createRequest()({ endpoint: document }).cacheKey,
    );
  });

  it("should keep one abort key for an operation name, whatever its selection", () => {
    const first = client.createRequest()({ endpoint: "query GetUser { user { name } }" });
    const second = client.createRequest()({ endpoint: "query GetUser { user { email } }" });

    expect(first.abortKey).toBe(second.abortKey);
  });
});

/** Refetching every variant of an operation after a mutation - `refetchQueries` in Apollo */
describe("Graphql Adapter [ Operation matcher ]", () => {
  const createClient = () => new Client({ url, mode: "client" }).setAdapter(GraphqlAdapter());
  const getUser = "query GetUser($id: ID!) { user(id: $id) { name } }";
  const getUserEmail = "query GetUser($id: ID!) { user(id: $id) { email } }";

  let client = createClient();
  let fetchSpy = vi.spyOn(globalThis, "fetch");

  beforeEach(() => {
    client = createClient();
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json({ data: { user: {} } }));
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  /** Send the request, so its response is cached under its cache key */
  const cacheRequest = async (request: RequestInstance) => {
    await request.send();
    return request.cacheKey;
  };

  const isStale = (cacheKey: string) => client.cache.get(cacheKey)?.staleTime === 0;

  it("should match every variant of a document", async () => {
    const request = client.createRequest<{ response: UserResponse; payload: { id: number } }>()({ endpoint: getUser });
    const first = await cacheRequest(request.setPayload({ id: 1 }));
    const second = await cacheRequest(request.setPayload({ id: 2 }));
    const asGet = await cacheRequest(
      client
        .createRequest<{ response: UserResponse; payload: { id: number } }>()({
          endpoint: getUser,
          method: GraphqlMethod.GET,
        })
        .setPayload({ id: 3 }),
    );
    const otherSelection = await cacheRequest(
      client
        .createRequest<{ response: UserResponse; payload: { id: number } }>()({ endpoint: getUserEmail })
        .setPayload({
          id: 1,
        }),
    );

    expect([first, second, asGet, otherSelection].map(isStale)).toStrictEqual([false, false, false, false]);

    client.cache.invalidate(matchGqlOperation(getUser));

    expect([first, second, asGet].map(isStale)).toStrictEqual([true, true, true]);
    expect(isStale(otherSelection)).toBeFalse();
  });

  it("should match a DocumentNode like the request built from it", async () => {
    const document = gql`
      query GetUser($id: ID!) {
        user(id: $id) {
          name
        }
      }
    `;
    const cacheKey = await cacheRequest(
      client.createRequest<{ response: UserResponse; payload: { id: number } }>()({ endpoint: document }).setPayload({
        id: 1,
      }),
    );

    expect(matchGqlOperation(document).test(cacheKey)).toBeTrue();
  });

  it("should match the document on every url path of the document option", () => {
    const first = client.createRequest()({ endpoint: "/a", document: getUser });
    const second = client.createRequest()({ endpoint: "/tenant/:tenantId/b", document: getUser }).setParams({
      tenantId: 1,
    });

    expect(matchGqlOperation(getUser).test(first.cacheKey)).toBeTrue();
    expect(matchGqlOperation(getUser).test(second.cacheKey)).toBeTrue();
  });

  it("should match only the url path of a request", () => {
    const onA = client.createRequest()({ endpoint: "/a", document: getUser });
    const onB = client.createRequest()({ endpoint: "/b", document: getUser });

    expect(matchGqlOperation(onA).test(onA.setQueryParams({ x: 1 }).cacheKey)).toBeTrue();
    expect(matchGqlOperation(onA).test(onB.cacheKey)).toBeFalse();
  });

  it("should not let regular expression characters in the path widen the match", () => {
    const dotted = client.createRequest()({ endpoint: "/a.b", document: getUser });
    const other = client.createRequest()({ endpoint: "/aXb", document: getUser });

    expect(matchGqlOperation(dotted).test(other.cacheKey)).toBeFalse();
  });

  it("should match every variant when it is used more than once", () => {
    const matcher = matchGqlOperation(getUser);
    const request = client.createRequest<{ response: UserResponse; payload: { id: number } }>()({ endpoint: getUser });

    expect(matcher.test(request.setPayload({ id: 1 }).cacheKey)).toBeTrue();
    expect(matcher.test(request.setPayload({ id: 2 }).cacheKey)).toBeTrue();
  });
});
