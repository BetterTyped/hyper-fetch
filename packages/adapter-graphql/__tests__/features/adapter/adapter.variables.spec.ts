import { Client } from "@hyper-fetch/core";
import { GraphqlAdapter, GraphqlMethod } from "adapter";

const url = "https://shared-base-url/graphql";
// Typed as a plain string: a literal would also make the adapter infer the variables from the query text
const getUser = "query GetUser($id: ID!) { user(id: $id) { name } }" as string;
const search = "query Search($filter: Filter) { search(filter: $filter) { name } }" as string;

type UserResponse = { user: { name: string } };

/**
 * The same operation with other variables is another query. It needs its own cache entry and its own queue -
 * otherwise `GetUser(id: 2)` would show the cached user 1 or be deduplicated into its request.
 */
describe("Graphql Adapter [ Variables ]", () => {
  // The cache is only kept in the "client" mode
  const createClient = () => new Client({ url, mode: "client" }).setAdapter(GraphqlAdapter());

  let client = createClient();
  let fetchSpy = vi.spyOn(globalThis, "fetch");

  /** Answer every request with the user whose id was sent in the variables */
  const answerWithRequestedUser = () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const fromBody = init?.body ? JSON.parse(String(init.body)).variables : undefined;
      const fromUrl = new URL(String(input)).searchParams.get("variables");
      const variables = fromBody ?? (fromUrl ? JSON.parse(fromUrl) : {});
      return Response.json({ data: { user: { name: `User ${variables.id}` } } });
    });
  };

  beforeEach(() => {
    client = createClient();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe("when building keys", () => {
    it("should give requests with different variables different cache and query keys", () => {
      const request = client.createRequest<{ response: UserResponse; payload: { id: number } }>()({
        endpoint: getUser,
      });
      const first = request.setPayload({ id: 1 });
      const second = request.setPayload({ id: 2 });

      expect(first.cacheKey).not.toBe(second.cacheKey);
      expect(first.queryKey).not.toBe(second.queryKey);
    });

    it("should give requests with equal variables the same keys", () => {
      const request = client.createRequest<{ response: UserResponse; payload: { id: number } }>()({
        endpoint: getUser,
      });

      expect(request.setPayload({ id: 1 }).cacheKey).toBe(request.setPayload({ id: 1 }).cacheKey);
      expect(request.setPayload({ id: 1 }).queryKey).toBe(request.setPayload({ id: 1 }).queryKey);
    });

    it("should keep the variables out of the keys of a request without them", () => {
      const request = client.createRequest<{ response: UserResponse }>()({
        endpoint: "query GetUsers { users { name } }",
      });

      expect(request.cacheKey).toMatch(/^POST_GetUsers@\w+--$/);
      expect(request.queryKey).toMatch(/^POST_GetUsers@\w+--$/);
    });

    it("should keep one abort key for an operation, whatever its variables", () => {
      const request = client.createRequest<{ response: UserResponse; payload: { id: number } }>()({
        endpoint: getUser,
      });

      expect(request.setPayload({ id: 1 }).abortKey).toBe(request.setPayload({ id: 2 }).abortKey);
    });

    it.each([
      [
        "nested objects",
        { filter: { tags: ["a", "b"], range: { from: 1 } } },
        { filter: { tags: ["a", "c"], range: { from: 1 } } },
      ],
      ["null and a value", { id: null }, { id: 1 }],
      ["numbers and strings", { id: 1 }, { id: "1" }],
      ["booleans", { active: true }, { active: false }],
      ["empty and filled lists", { ids: [] }, { ids: [1] }],
    ])("should tell apart variables that differ in %s", (_name, left, right) => {
      const request = client.createRequest<{ response: UserResponse; payload: Record<string, unknown> }>()({
        endpoint: search,
      });

      expect(request.setPayload(left).cacheKey).not.toBe(request.setPayload(right).cacheKey);
    });

    it("should respect a cache key set by hand", () => {
      const request = client
        .createRequest<{ response: UserResponse; payload: { id: number } }>()({ endpoint: getUser })
        .setCacheKey("my-key");

      expect(request.setPayload({ id: 1 }).cacheKey).toBe("my-key");
      expect(request.setPayload({ id: 2 }).cacheKey).toBe("my-key");
    });

    it("should use the variables passed to send()", async () => {
      answerWithRequestedUser();
      const request = client.createRequest<{ response: UserResponse; payload: { id: number } }>()({
        endpoint: getUser,
      });

      await request.send({ payload: { id: 1 } });
      await request.send({ payload: { id: 2 } });

      expect(request.setPayload({ id: 1 }).read()?.data).toEqual({ user: { name: "User 1" } });
      expect(request.setPayload({ id: 2 }).read()?.data).toEqual({ user: { name: "User 2" } });
    });
  });

  describe.each([GraphqlMethod.POST, GraphqlMethod.GET])("when sending %s queries", (method) => {
    it("should cache every set of variables on its own", async () => {
      answerWithRequestedUser();
      const request = client.createRequest<{ response: UserResponse; payload: { id: number } }>()({
        endpoint: getUser,
        method,
      });
      const first = request.setPayload({ id: 1 });
      const second = request.setPayload({ id: 2 });

      const [firstResponse, secondResponse] = await Promise.all([first.send(), second.send()]);

      expect(firstResponse.data).toEqual({ user: { name: "User 1" } });
      expect(secondResponse.data).toEqual({ user: { name: "User 2" } });
      expect(first.read()?.data).toEqual({ user: { name: "User 1" } });
      expect(second.read()?.data).toEqual({ user: { name: "User 2" } });
    });

    it("should not deduplicate requests with different variables", async () => {
      answerWithRequestedUser();
      const request = client.createRequest<{ response: UserResponse; payload: { id: number } }>()({
        endpoint: getUser,
        method,
        deduplicate: true,
      });

      const responses = await Promise.all([
        request.setPayload({ id: 1 }).send(),
        request.setPayload({ id: 2 }).send(),
        request.setPayload({ id: 1 }).send(),
      ]);

      expect(responses.map((response) => response.data?.user.name)).toEqual(["User 1", "User 2", "User 1"]);
      // The two requests for user 1 share one network call
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("should run queued requests with different variables side by side", async () => {
      answerWithRequestedUser();
      const request = client.createRequest<{ response: UserResponse; payload: { id: number } }>()({
        endpoint: getUser,
        method,
        queued: true,
      });

      const responses = await Promise.all([1, 2, 3].map((id) => request.setPayload({ id }).send()));

      expect(responses.map((response) => response.data?.user.name)).toEqual(["User 1", "User 2", "User 3"]);
    });
  });
});
