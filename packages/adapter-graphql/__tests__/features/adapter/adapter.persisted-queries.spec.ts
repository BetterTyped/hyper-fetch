import { Client } from "@hyper-fetch/core";
import { GraphqlAdapter, GraphqlMethod } from "adapter";
import { createHash } from "node:crypto";

const url = "https://shared-base-url/graphql";
const query = "query GetUser { user { name } }";
const sha256Hash = createHash("sha256").update(query).digest("hex");
const persistedQuery = { version: 1, sha256Hash };

type UserResponse = { user: { name: string } };

/**
 * Automatic persisted queries: the hash goes first, the full query only when the server does not know it yet.
 * Hashed GET requests stay short, so CDNs can cache them.
 */
describe("Graphql Adapter [ Persisted queries ]", () => {
  let client = new Client({ url }).setAdapter(GraphqlAdapter());
  let fetchSpy = vi.spyOn(globalThis, "fetch");

  const json = (body: unknown, status = 200) => Response.json(body, { status });
  const notFound = { errors: [{ message: "PersistedQueryNotFound" }] };
  const notSupported = { errors: [{ message: "PersistedQueryNotSupported" }] };
  const user = { data: { user: { name: "Ann" } } };

  const createRequest = (method: GraphqlMethod = GraphqlMethod.POST) =>
    client.createRequest<{ response: UserResponse }>()({
      endpoint: query,
      method,
      options: { persistedQueries: true },
    });

  const sentBody = (call: number) => JSON.parse(String(fetchSpy.mock.calls[call][1]?.body));
  const sentParams = (call: number) => new URL(String(fetchSpy.mock.calls[call][0])).searchParams;

  beforeEach(() => {
    client = new Client({ url }).setAdapter(GraphqlAdapter());
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("should send the full query when persisted queries are off", async () => {
    fetchSpy.mockResolvedValueOnce(json(user));

    await client.createRequest<{ response: UserResponse }>()({ endpoint: query }).send();

    expect(sentBody(0)).toEqual({ query, operationName: "GetUser" });
  });

  it("should send only the hash when the server knows the query", async () => {
    fetchSpy.mockResolvedValueOnce(json(user));

    const response = await createRequest().send();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sentBody(0)).toEqual({ operationName: "GetUser", extensions: { persistedQuery } });
    expect(response).toMatchObject({ data: user.data, error: null, success: true });
  });

  it.each([
    ["the message", notFound],
    ["the error code", { errors: [{ message: "Not found", extensions: { code: "PERSISTED_QUERY_NOT_FOUND" } }] }],
  ])("should register the query when the server reports by %s that it does not know it", async (_name, miss) => {
    fetchSpy.mockResolvedValueOnce(json(miss)).mockResolvedValueOnce(json(user));

    const response = await createRequest().send();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(sentBody(1)).toEqual({ query, operationName: "GetUser", extensions: { persistedQuery } });
    expect(response).toMatchObject({ data: user.data, error: null, success: true });
  });

  it("should register the query after a miss reported with a failed status", async () => {
    fetchSpy.mockResolvedValueOnce(json(notFound, 400)).mockResolvedValueOnce(json(user));

    const response = await createRequest().send();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(response).toMatchObject({ data: user.data, success: true, status: 200 });
  });

  it("should send full queries after the server reports it does not support persisted queries", async () => {
    fetchSpy
      .mockResolvedValueOnce(json(notSupported))
      .mockResolvedValueOnce(json(user))
      .mockResolvedValueOnce(json(user));

    const first = await createRequest().send();
    const second = await createRequest().send();

    expect(first).toMatchObject({ data: user.data, success: true });
    expect(second).toMatchObject({ data: user.data, success: true });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(sentBody(1)).toEqual({ query, operationName: "GetUser" });
    expect(sentBody(2)).toEqual({ query, operationName: "GetUser" });
  });

  it("should not retry other errors", async () => {
    fetchSpy.mockResolvedValueOnce(json({ errors: [{ message: "Not allowed" }] }));

    const response = await createRequest().send();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({ data: null, error: [{ message: "Not allowed" }], success: false });
  });

  it("should return the error of the registering request", async () => {
    fetchSpy.mockResolvedValueOnce(json(notFound)).mockResolvedValueOnce(json({ errors: [{ message: "Invalid" }] }));

    const response = await createRequest().send();

    expect(response).toMatchObject({ data: null, error: [{ message: "Invalid" }], success: false });
  });

  it("should send the hash without the query in the url of a GET request", async () => {
    fetchSpy.mockResolvedValueOnce(json(user));

    await createRequest(GraphqlMethod.GET).send();

    const params = sentParams(0);
    expect(params.has("query")).toBeFalse();
    expect(params.get("operationName")).toBe("GetUser");
    expect(JSON.parse(params.get("extensions") ?? "")).toEqual({ persistedQuery });
    expect(fetchSpy.mock.calls[0][1]?.body).toBeUndefined();
  });

  it("should keep the extensions of the GET url over a query param with the same key", async () => {
    fetchSpy.mockResolvedValueOnce(json(user));
    const request = client
      .createRequest<{ response: UserResponse; queryParams: { extensions: string } }>()({
        endpoint: query,
        method: GraphqlMethod.GET,
        options: { persistedQueries: true },
      })
      .setQueryParams({ extensions: "other" });

    await request.send();

    expect(sentParams(0).getAll("extensions")).toStrictEqual([JSON.stringify({ persistedQuery })]);
  });

  it("should register a GET query in the url", async () => {
    fetchSpy.mockResolvedValueOnce(json(notFound)).mockResolvedValueOnce(json(user));

    await createRequest(GraphqlMethod.GET).send();

    const params = sentParams(1);
    expect(params.get("query")).toBe(query);
    expect(JSON.parse(params.get("extensions") ?? "")).toEqual({ persistedQuery });
  });

  it("should send the full query when the runtime has no Web Crypto", async () => {
    // Insecure contexts expose crypto without subtle
    vi.stubGlobal("crypto", {});
    fetchSpy.mockResolvedValueOnce(json(user));

    const response = await createRequest().send();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sentBody(0)).toEqual({ query, operationName: "GetUser" });
    expect(response).toMatchObject({ data: user.data, success: true });
  });

  it("should take the option from the adapter defaults", async () => {
    fetchSpy.mockResolvedValueOnce(json(user));
    const defaulted = new Client({ url }).setAdapter(
      GraphqlAdapter().setAdapterDefaults(() => ({ persistedQueries: true })),
    );

    await defaulted.createRequest<{ response: UserResponse }>()({ endpoint: query }).send();

    expect(sentBody(0)).toEqual({ operationName: "GetUser", extensions: { persistedQuery } });
  });

  it("should time out a registering request that does not answer", async () => {
    fetchSpy.mockResolvedValueOnce(json(notFound)).mockImplementationOnce(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );
    const request = client.createRequest<{ response: UserResponse }>()({
      endpoint: query,
      options: { persistedQueries: true, timeout: 50 },
    });

    const response = await request.send();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(response).toMatchObject({ data: null, success: false, status: 0 });
    expect(response.error).toHaveLength(1);
  });

  it("should report the progress of the response once for a hashed request", async () => {
    fetchSpy.mockResolvedValueOnce(json(user));
    const onProgress = vi.fn();

    await createRequest().send({ onDownloadProgress: onProgress });

    const progress = onProgress.mock.calls.map(([event]) => event.loaded);
    expect(progress.length).toBeGreaterThan(0);
    expect(progress.every((value, index) => index === 0 || value >= progress[index - 1])).toBeTrue();
  });
});
