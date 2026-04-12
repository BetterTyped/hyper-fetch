import { Client } from "client";

describe("Request [ Optimistic ]", () => {
  let client = new Client({ url: "shared-base-url" });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
  });

  describe("setOptimistic", () => {
    it("should return a cloned request (not same reference)", () => {
      const request = client.createRequest()({ endpoint: "/users", method: "POST" });
      const callback = () => ({});
      const optimistic = request.setOptimistic(callback);

      expect(optimistic).not.toBe(request);
      expect(optimistic.optimistic).toBeDefined();
      expect(request.optimistic).toBeUndefined();
    });

    it("should store the optimistic callback on the cloned request", () => {
      const request = client.createRequest()({ endpoint: "/users", method: "POST" });
      const callback = () => ({ context: { snapshot: "test" } });
      const optimistic = request.setOptimistic(callback);

      expect(optimistic.optimistic).toBeDefined();
      expect(typeof optimistic.optimistic).toBe("function");
    });

    it("should preserve the optimistic callback through clone()", () => {
      const request = client.createRequest()({ endpoint: "/users", method: "POST" });
      const callback = () => ({ context: { snapshot: "test" } });
      const optimistic = request.setOptimistic(callback);
      const cloned = optimistic.clone();

      expect(cloned.optimistic).toBe(optimistic.optimistic);
    });

    it("should preserve optimistic through full chaining: setOptimistic → setParams → setRetry → clone", () => {
      const request = client.createRequest<{
        response: { id: number };
        payload: { name: string };
      }>()({ endpoint: "/users/:userId", method: "PATCH" });

      const callback = () => ({ context: { prev: "data" } });
      const chained = request.setOptimistic(callback).setParams({ userId: 1 }).setRetry(2).clone();

      expect(chained.optimistic).toBeDefined();
      expect(chained.retry).toBe(2);
      expect(chained.params).toStrictEqual({ userId: 1 });
    });

    it("should let last setOptimistic call win when called multiple times", () => {
      const request = client.createRequest()({ endpoint: "/users", method: "POST" });
      const callback1 = () => ({ context: "first" });
      const callback2 = () => ({ context: "second" });

      const result = request.setOptimistic(callback1).setOptimistic(callback2);

      expect(result.optimistic).toBeDefined();
      const callResult = result.optimistic!({ request: result, client, payload: undefined });
      expect(callResult).toStrictEqual({ context: "second" });
    });

    it("should pass correct args to the callback (request, client, payload)", async () => {
      const request = client.createRequest<{
        response: { id: number };
        payload: { name: string };
      }>()({ endpoint: "/users/:userId", method: "PATCH" });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const callbackSpy = vi.fn((_args: { request: unknown; client: unknown; payload: unknown }) => ({
        context: { done: true },
      }));
      const withOptimistic = request.setOptimistic(callbackSpy).setParams({ userId: 42 });

      const payload = { name: "Test" };
      const reqWithPayload = withOptimistic.setPayload(payload);

      reqWithPayload.optimistic!({
        request: reqWithPayload,
        client: reqWithPayload.client,
        payload: reqWithPayload.payload,
      });

      expect(callbackSpy).toHaveBeenCalledTimes(1);
      const args = callbackSpy.mock.calls[0][0];
      expect(args.request).toBe(reqWithPayload);
      expect(args.client).toBe(client);
      expect(args.payload).toStrictEqual(payload);
    });
  });
});
