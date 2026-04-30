import { createHttpMockingServer } from "@hyper-fetch/testing";
import { Client } from "client";
import { Request } from "request";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Client [ fromJSON ]", () => {
  let client = new Client({ url: "shared-base-url" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When reconstructing a request from JSON", () => {
    it("should return a Request class instance", () => {
      const original = client.createRequest()({ endpoint: "/users", method: "GET" });
      const json = original.toJSON();
      const restored = client.fromJSON(json);

      expect(restored).toBeInstanceOf(Request);
    });

    it("should preserve endpoint from the original request", () => {
      const original = client.createRequest()({ endpoint: "/users/:id", method: "GET" });
      const json = original.toJSON();
      const restored = client.fromJSON(json);

      expect(restored.endpoint).toBe("/users/:id");
    });

    it("should preserve method from the original request", () => {
      const original = client.createRequest()({ endpoint: "/users", method: "POST" });
      const json = original.toJSON();
      const restored = client.fromJSON(json);

      expect(restored.method).toBe("POST");
    });

    it("should preserve request options through serialization", () => {
      const original = client.createRequest()({
        endpoint: "/data",
        method: "PUT",
        cache: true,
        retry: 3,
        cacheTime: 5000,
      });
      const json = original.toJSON();
      const restored = client.fromJSON(json);

      expect(restored.cache).toBe(true);
      expect(restored.retry).toBe(3);
      expect(restored.cacheTime).toBe(5000);
    });

    it("should bind the restored request to the client", () => {
      const original = client.createRequest()({ endpoint: "/test", method: "GET" });
      const json = original.toJSON();
      const restored = client.fromJSON(json);

      expect(restored.client).toBe(client);
    });
  });

  describe("When using type generics", () => {
    it("should produce the same response type as createRequest", () => {
      type Props = { response: { id: number; name: string } };

      const created = client.createRequest<Props>()({ endpoint: "/users", method: "GET" });
      const restored = client.fromJSON<Props>(created.toJSON());

      type CreatedData = Awaited<ReturnType<typeof created.send>>["data"];
      type RestoredData = Awaited<ReturnType<typeof restored.send>>["data"];

      expectTypeOf<RestoredData>().toEqualTypeOf<CreatedData>();
    });

    it("should produce the same payload type as createRequest", () => {
      type Props = { response: { id: number }; payload: { name: string; email: string } };

      const created = client.createRequest<Props>()({ endpoint: "/users", method: "POST" });
      const restored = client.fromJSON<Props>(created.toJSON());

      type CreatedPayload = Parameters<typeof created.setPayload>[0];
      type RestoredPayload = Parameters<typeof restored.setPayload>[0];

      expectTypeOf<RestoredPayload>().toEqualTypeOf<CreatedPayload>();
    });

    it("should produce the same error type as createRequest", () => {
      type Props = { error: { code: string; message: string } };

      const created = client.createRequest<Props>()({ endpoint: "/fail", method: "GET" });
      const restored = client.fromJSON<Props>(created.toJSON());

      type CreatedError = Awaited<ReturnType<typeof created.send>>["error"];
      type RestoredError = Awaited<ReturnType<typeof restored.send>>["error"];

      expectTypeOf<RestoredError>().toEqualTypeOf<CreatedError>();
    });

    it("should produce the same defaults as createRequest when no generics are passed", () => {
      const created = client.createRequest()({ endpoint: "/test", method: "GET" });
      const restored = client.fromJSON(created.toJSON());

      type CreatedData = Awaited<ReturnType<typeof created.send>>["data"];
      type RestoredData = Awaited<ReturnType<typeof restored.send>>["data"];

      type CreatedPayload = Parameters<typeof created.setPayload>[0];
      type RestoredPayload = Parameters<typeof restored.setPayload>[0];

      expectTypeOf<RestoredData>().toEqualTypeOf<CreatedData>();
      expectTypeOf<RestoredPayload>().toEqualTypeOf<CreatedPayload>();
    });

    it("should produce the same endpoint params type as createRequest", () => {
      type Props = { response: { id: number }; endpoint: "/users/:userId" };

      const created = client.createRequest<Props>()({ endpoint: "/users/:userId", method: "GET" });
      const restored = client.fromJSON<Props>(created.toJSON());

      type CreatedParams = Parameters<typeof created.setParams>[0];
      type RestoredParams = Parameters<typeof restored.setParams>[0];

      expectTypeOf<RestoredParams>().toEqualTypeOf<CreatedParams>();
    });

    it("should produce the same query params type as createRequest", () => {
      type Props = { queryParams: { search?: string; page?: number } };

      const created = client.createRequest<Props>()({ endpoint: "/search", method: "GET" });
      const restored = client.fromJSON<Props>(created.toJSON());

      type CreatedQueryParams = Parameters<typeof created.setQueryParams>[0];
      type RestoredQueryParams = Parameters<typeof restored.setQueryParams>[0];

      expectTypeOf<RestoredQueryParams>().toEqualTypeOf<CreatedQueryParams>();
    });

    it("should produce matching types for all generics combined", () => {
      type Props = {
        response: { id: number };
        payload: { name: string };
        error: { msg: string };
        queryParams: { limit: number };
        endpoint: "/items/:itemId";
      };

      const created = client.createRequest<Props>()({ endpoint: "/items/:itemId", method: "POST" });
      const restored = client.fromJSON<Props>(created.toJSON());

      type CreatedData = Awaited<ReturnType<typeof created.send>>["data"];
      type RestoredData = Awaited<ReturnType<typeof restored.send>>["data"];
      expectTypeOf<RestoredData>().toEqualTypeOf<CreatedData>();

      type CreatedError = Awaited<ReturnType<typeof created.send>>["error"];
      type RestoredError = Awaited<ReturnType<typeof restored.send>>["error"];
      expectTypeOf<RestoredError>().toEqualTypeOf<CreatedError>();

      type CreatedPayload = Parameters<typeof created.setPayload>[0];
      type RestoredPayload = Parameters<typeof restored.setPayload>[0];
      expectTypeOf<RestoredPayload>().toEqualTypeOf<CreatedPayload>();

      type CreatedParams = Parameters<typeof created.setParams>[0];
      type RestoredParams = Parameters<typeof restored.setParams>[0];
      expectTypeOf<RestoredParams>().toEqualTypeOf<CreatedParams>();

      type CreatedQueryParams = Parameters<typeof created.setQueryParams>[0];
      type RestoredQueryParams = Parameters<typeof restored.setQueryParams>[0];
      expectTypeOf<RestoredQueryParams>().toEqualTypeOf<CreatedQueryParams>();
    });
  });
});
