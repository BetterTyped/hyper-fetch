/**
 * @vitest-environment node
 */
import { Client, getErrorMessage } from "@hyper-fetch/core";

import { GraphqlAdapter, GraphqlMethod } from "../../src/adapter";
import { GraphQlExtraType } from "../../src/adapter/adapter.types";
import { createE2EGraphQLServer } from "./e2e.graphql-server";

// ─── Schema & Resolvers ──────────────────────────────────────────────

const typeDefs = `
  type User {
    id: ID!
    username: String!
    firstName: String!
    email: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    user(id: ID!): User
    users: [User!]!
    search(term: String!): [User!]!
  }

  type Mutation {
    login(username: String!, password: String!): AuthPayload!
    createUser(username: String!, firstName: String!, email: String): User!
    deleteUser(id: ID!): Boolean!
  }
`;

const usersDb: Array<{ id: string; username: string; firstName: string; email: string | null }> = [
  { id: "1", username: "john", firstName: "John", email: "john@example.com" },
  { id: "2", username: "jane", firstName: "Jane", email: null },
  { id: "3", username: "bob", firstName: "Bob", email: "bob@example.com" },
];

let nextId = 4;

const resolvers = {
  user: ({ id }: { id: string }) => {
    return usersDb.find((u) => u.id === id) || null;
  },
  users: () => usersDb,
  search: ({ term }: { term: string }) => {
    return usersDb.filter((u) => u.username.includes(term) || u.firstName.includes(term));
  },
  login: ({ username, password }: { username: string; password: string }) => {
    if (password.length < 4) throw new Error("Password too short");
    return {
      token: `token-${username}`,
      user: usersDb.find((u) => u.username === username) || { id: "0", username, firstName: username, email: null },
    };
  },
  createUser: ({ username, firstName, email }: { username: string; firstName: string; email?: string }) => {
    // eslint-disable-next-line no-plusplus
    const user = { id: String(nextId++), username, firstName, email: email || null };
    usersDb.push(user);
    return user;
  },
  deleteUser: ({ id }: { id: string }) => {
    const idx = usersDb.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    usersDb.splice(idx, 1);
    return true;
  },
};

type GqlResponse<T> = { response: T; error: { message: string }[] };

// ─── Server Setup ────────────────────────────────────────────────────

const { startServer, stopServer } = createE2EGraphQLServer({ typeDefs, resolvers });

let baseUrl: string;

beforeAll(async () => {
  baseUrl = await startServer();
});

afterAll(async () => {
  await stopServer();
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("E2E GraphQL [ Queries ]", () => {
  it("should fetch a list of users", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<
      GqlResponse<{ users: { id: string; username: string; firstName: string }[] }>
    >()({
      endpoint: "query { users { id username firstName } }",
    });

    const { data, error, status } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toBeDefined();
    expect(data!.users.length).toBeGreaterThanOrEqual(3);
    expect(data!.users[0]).toHaveProperty("username");
    expect(data!.users[0]).toHaveProperty("firstName");
  });

  it("should fetch a single user by ID with variables", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<
      GqlResponse<{ user: { id: string; username: string; firstName: string; email: string | null } }> & {
        payload: { id: string };
      }
    >()({
      endpoint: `query GetUser($id: ID!) { user(id: $id) { id username firstName email } }`,
    });

    const { data, error, status } = await request.send({ payload: { id: "1" } } as any);

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data!.user).toStrictEqual({
      id: "1",
      username: "john",
      firstName: "John",
      email: "john@example.com",
    });
  });

  it("should return null for non-existent user", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<
      GqlResponse<{ user: { id: string; username: string } | null }> & { payload: { id: string } }
    >()({
      endpoint: `query GetUser($id: ID!) { user(id: $id) { id username } }`,
    });

    const { data, error, status } = await request.send({ payload: { id: "999" } } as any);

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data!.user).toBeNull();
  });

  it("should perform search query with string variable", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<
      GqlResponse<{ search: { username: string }[] }> & { payload: { term: string } }
    >()({
      endpoint: `query Search($term: String!) { search(term: $term) { username } }`,
    });

    const { data, error } = await request.send({ payload: { term: "john" } } as any);

    expect(error).toBeNull();
    expect(data!.search).toStrictEqual([{ username: "john" }]);
  });

  it("should work with GET method via query string", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<{ users: { id: string; username: string }[] }>>()({
      endpoint: `query { users { id username } }`,
      method: GraphqlMethod.GET,
    });

    const { data, error, status } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data!.users.length).toBeGreaterThanOrEqual(3);
  });

  it("should fetch partial fields from user", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<{ user: { username: string } }> & { payload: { id: string } }>()({
      endpoint: `query GetUser($id: ID!) { user(id: $id) { username } }`,
    });

    const { data, error } = await request.send({ payload: { id: "1" } } as any);

    expect(error).toBeNull();
    expect(data!.user).toStrictEqual({ username: "john" });
  });
});

describe("E2E GraphQL [ Mutations ]", () => {
  it("should perform login mutation", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<
      GqlResponse<{ login: { token: string; user: { username: string } } }> & {
        payload: { username: string; password: string };
      }
    >()({
      endpoint: `mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          token
          user { username }
        }
      }`,
    });

    const { data, error, status } = await request.send({
      payload: { username: "john", password: "secret123" },
    } as any);

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data!.login.token).toBe("token-john");
    expect(data!.login.user.username).toBe("john");
  });

  it("should handle mutation validation errors from resolver", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<
      GqlResponse<{ login: { token: string } }> & { payload: { username: string; password: string } }
    >()({
      endpoint: `mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) { token }
      }`,
    });

    const { data, error, status } = await request.send({
      payload: { username: "john", password: "ab" },
    } as any);

    expect(status).toBe(200);
    expect(data).toBeNull();
    expect(error).toBeDefined();
    const errors = error as { message: string }[];
    expect(errors[0]).toHaveProperty("message");
    expect(errors[0].message).toContain("Password too short");
  });

  it("should create a new user", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<
      GqlResponse<{ createUser: { id: string; username: string; firstName: string; email: string | null } }> & {
        payload: { username: string; firstName: string; email?: string };
      }
    >()({
      endpoint: `mutation CreateUser($username: String!, $firstName: String!, $email: String) {
        createUser(username: $username, firstName: $firstName, email: $email) {
          id username firstName email
        }
      }`,
    });

    const { data, error } = await request.send({
      payload: { username: "alice", firstName: "Alice", email: "alice@test.com" },
    } as any);

    expect(error).toBeNull();
    expect(data!.createUser.username).toBe("alice");
    expect(data!.createUser.firstName).toBe("Alice");
    expect(data!.createUser.email).toBe("alice@test.com");
    expect(data!.createUser.id).toBeDefined();
  });

  it("should create a user without optional email", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<
      GqlResponse<{ createUser: { id: string; username: string; email: string | null } }> & {
        payload: { username: string; firstName: string };
      }
    >()({
      endpoint: `mutation CreateUser($username: String!, $firstName: String!, $email: String) {
        createUser(username: $username, firstName: $firstName, email: $email) {
          id username email
        }
      }`,
    });

    const { data, error } = await request.send({
      payload: { username: "noEmail", firstName: "No Email" },
    } as any);

    expect(error).toBeNull();
    expect(data!.createUser.email).toBeNull();
  });

  it("should delete a user", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<{ deleteUser: boolean }> & { payload: { id: string } }>()({
      endpoint: `mutation DeleteUser($id: ID!) { deleteUser(id: $id) }`,
    });

    const { data, error } = await request.send({ payload: { id: "3" } } as any);

    expect(error).toBeNull();
    expect(data!.deleteUser).toBe(true);
  });

  it("should return false when deleting non-existent user", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<{ deleteUser: boolean }> & { payload: { id: string } }>()({
      endpoint: `mutation DeleteUser($id: ID!) { deleteUser(id: $id) }`,
    });

    const { data, error } = await request.send({ payload: { id: "999" } } as any);

    expect(error).toBeNull();
    expect(data!.deleteUser).toBe(false);
  });
});

describe("E2E GraphQL [ Error Handling ]", () => {
  it("should handle invalid GraphQL syntax", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<any>>()({
      endpoint: `query { invalid { `,
    });

    const { data, error, status } = await request.send();

    expect(status).toBe(200);
    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect((error as { message: string }[]).length).toBeGreaterThan(0);
  });

  it("should handle queries against non-existent fields", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<any>>()({
      endpoint: `query { nonExistentField { id } }`,
    });

    const { data, error } = await request.send();

    expect(data).toBeNull();
    expect(error).toBeDefined();
  });

  it("should handle missing required variables", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<{ user: any }>>()({
      endpoint: `query GetUser($id: ID!) { user(id: $id) { id } }`,
    });

    const { data, error } = await request.send({} as any);

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect((error as { message: string }[]).length).toBeGreaterThan(0);
  });

  it("should handle abort/cancel of request", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<any>>()({
      endpoint: `query { users { id } }`,
    });

    setTimeout(() => request.abort(), 0);

    const { data, error } = await request.send();

    expect(data).toBeNull();
    expect(error).toStrictEqual([getErrorMessage("abort")]);
  });
});

describe("E2E GraphQL [ Headers & Extras ]", () => {
  it("should include response headers in extra", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<any>>()({
      endpoint: `query { users { id } }`,
    });

    const { extra } = await request.send();

    expect(extra).toBeDefined();
    const typedExtra = extra as GraphQlExtraType;
    expect(typedExtra.headers).toBeDefined();
    expect((typedExtra.headers as Record<string, string>)["content-type"]).toBe("application/json");
  });

  it("should pass custom headers to the server", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client
      .createRequest<GqlResponse<any>>()({
        endpoint: `query { users { id } }`,
      })
      .setHeaders({ Authorization: "Bearer test-token" });

    const { data, error, status } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  it("should include extensions in extra when present", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<any>>()({
      endpoint: `query { users { id } }`,
    });

    const { extra } = await request.send();

    expect(extra).toBeDefined();
    expect((extra as GraphQlExtraType).extensions).toBeDefined();
  });

  it("should include content-length in response headers", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<any>>()({
      endpoint: `query { users { id } }`,
    });

    const { extra } = await request.send();

    const headers = (extra as GraphQlExtraType).headers as Record<string, string>;
    expect(headers["content-length"]).toBeDefined();
    expect(Number(headers["content-length"])).toBeGreaterThan(0);
  });
});

describe("E2E GraphQL [ Multiple Operations ]", () => {
  it("should handle named operations", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());
    const request = client.createRequest<GqlResponse<{ users: { id: string; username: string }[] }>>()({
      endpoint: `query ListUsers { users { id username } }`,
    });

    const { data, error } = await request.send();

    expect(error).toBeNull();
    expect(data!.users.length).toBeGreaterThanOrEqual(2);
  });

  it("should handle sequential requests sharing a client", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());

    const listRequest = client.createRequest<GqlResponse<{ users: { id: string }[] }>>()({
      endpoint: `query { users { id } }`,
    });

    const getRequest = client.createRequest<
      GqlResponse<{ user: { id: string; username: string } }> & { payload: { id: string } }
    >()({
      endpoint: `query GetUser($id: ID!) { user(id: $id) { id username } }`,
    });

    const listResult = await listRequest.send();
    expect(listResult.error).toBeNull();
    expect(listResult.data!.users.length).toBeGreaterThanOrEqual(2);

    const firstUserId = listResult.data!.users[0].id;
    const getResult = await getRequest.send({ payload: { id: firstUserId } } as any);
    expect(getResult.error).toBeNull();
    expect(getResult.data!.user.id).toBe(firstUserId);
  });

  it("should handle concurrent requests", async () => {
    const client = new Client({ url: baseUrl }).setAdapter(GraphqlAdapter());

    const req1 = client
      .createRequest<GqlResponse<{ user: { username: string } }> & { payload: { id: string } }>()({
        endpoint: `query GetUser($id: ID!) { user(id: $id) { username } }`,
      })
      .send({ payload: { id: "1" } } as any);

    const req2 = client
      .createRequest<GqlResponse<{ user: { username: string } }> & { payload: { id: string } }>()({
        endpoint: `query GetUser($id: ID!) { user(id: $id) { username } }`,
      })
      .send({ payload: { id: "2" } } as any);

    const [result1, result2] = await Promise.all([req1, req2]);

    expect(result1.error).toBeNull();
    expect(result2.error).toBeNull();
    expect(result1.data!.user.username).toBe("john");
    expect(result2.data!.user.username).toBe("jane");
  });
});
