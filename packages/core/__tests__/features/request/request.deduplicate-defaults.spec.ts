import { createHttpMockingServer } from "@hyper-fetch/testing";
import type { ClientInstance } from "client";
import { createClient } from "client";
import { HttpMethods } from "constants/http.constants";
import { getRequestDispatcher } from "request";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

/**
 * Safe reads (GET, QUERY) deduplicate by default on the HTTP adapter: concurrent
 * identical requests collapse into a single network call. Mutations keep the old
 * behavior, and an explicit `deduplicate` always wins over the default.
 */
describe("Request [ Deduplicate defaults ]", () => {
  let client: ClientInstance;

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    client = createClient({ url: "http://localhost:3000" });
  });

  afterAll(() => {
    stopServer();
  });

  it("should deduplicate safe reads by default and leave mutations off", () => {
    expect(client.createRequest()({ endpoint: "/users", method: HttpMethods.GET }).deduplicate).toBe(true);
    expect(client.createRequest()({ endpoint: "/users", method: HttpMethods.QUERY }).deduplicate).toBe(true);
    // No method falls back to the adapter default (GET)
    expect(client.createRequest()({ endpoint: "/users" }).deduplicate).toBe(true);

    expect(client.createRequest()({ endpoint: "/users", method: HttpMethods.POST }).deduplicate).toBe(false);
    expect(client.createRequest()({ endpoint: "/users", method: HttpMethods.PUT }).deduplicate).toBe(false);
    expect(client.createRequest()({ endpoint: "/users", method: HttpMethods.PATCH }).deduplicate).toBe(false);
    expect(client.createRequest()({ endpoint: "/users", method: HttpMethods.DELETE }).deduplicate).toBe(false);
  });

  it("should let explicit deduplicate settings win over the default", () => {
    const optedOut = client.createRequest()({ endpoint: "/users", method: HttpMethods.GET, deduplicate: false });
    expect(optedOut.deduplicate).toBe(false);

    const optedIn = client.createRequest()({ endpoint: "/users", method: HttpMethods.POST, deduplicate: true });
    expect(optedIn.deduplicate).toBe(true);

    const setterWins = client.createRequest()({ endpoint: "/users", method: HttpMethods.GET }).setDeduplicate(false);
    expect(setterWins.deduplicate).toBe(false);
  });

  it("should route QUERY to the fetch dispatcher like other safe reads", () => {
    const query = client.createRequest()({ endpoint: "/search", method: HttpMethods.QUERY });
    const get = client.createRequest()({ endpoint: "/search", method: HttpMethods.GET });
    const post = client.createRequest()({ endpoint: "/search", method: HttpMethods.POST });

    expect(getRequestDispatcher(query)[1]).toBe(true);
    expect(getRequestDispatcher(get)[1]).toBe(true);
    expect(getRequestDispatcher(post)[1]).toBe(false);
  });

  it("should collapse concurrent identical GET requests into one call", async () => {
    const request = client.createRequest<{ response: { ok: boolean } }>()({
      endpoint: "/users",
      method: HttpMethods.GET,
    });
    mockRequest(request, { data: { ok: true } });

    const deduplicatedSpy = vi.fn();
    client.requestManager.events.onDeduplicated(deduplicatedSpy);

    const [first, second] = await Promise.all([request.send(), request.send()]);

    expect(first.data).toEqual({ ok: true });
    expect(second.data).toEqual({ ok: true });
    expect(deduplicatedSpy).toHaveBeenCalledTimes(1);
  });
});
