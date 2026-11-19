/**
 * @vitest-environment jsdom
 */
import { createClient, createSdk } from "@hyper-fetch/core";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import type { TrpcSchema } from "../../src/adapter";
import { TrpcAdapter } from "../../src/adapter";
import type { AppRouter, Gate } from "./e2e.trpc-server";
import { createAppRouter, createE2ETrpcServer, createGate } from "./e2e.trpc-server";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/** Hooks re-render only for the fields read during the render */
const track = <T extends Record<string, any>>(hook: T) => {
  ["data", "error", "status", "loading", "submitting"].forEach((field) => hook[field]);
  return hook;
};

describe("Trpc Adapter [ React ]", () => {
  let gate: Gate = createGate();
  let server = createE2ETrpcServer(createAppRouter(() => gate));
  let url = "";

  const createApi = () => {
    const client = createClient({ url, mode: "client" }).setAdapter(TrpcAdapter());
    return { client, api: createSdk<typeof client, TrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false }) };
  };

  // Every test gets its own server, so requests of the previous test can't be counted
  beforeEach(async () => {
    gate = createGate();
    server = createE2ETrpcServer(createAppRouter(() => gate));
    url = await server.startServer();
  });

  afterEach(async () => {
    cleanup();
    gate.release();
    await server.stopServer();
  });

  describe("when using useFetch", () => {
    it("should load a query", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useFetch(api.user.byId.$query.setPayload({ id: 1 }))));

      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(result.current.data).toStrictEqual({ id: 1, name: "John" }));
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe(200);
    });

    it("should expose the procedure error", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useFetch(api.user.byId.$query.setPayload({ id: 999 }))));

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.data).toBeNull();
      expect(result.current.status).toBe(404);
      expect(result.current.error).toMatchObject({ message: "User not found", data: { code: "NOT_FOUND" } });
    });

    it.each([
      ["zero", 0, 0],
      ["negative result", -2, -4],
    ])("should expose a %s output", async (_name, input, output) => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useFetch(api.double.$query.setPayload(input))));

      await waitFor(() => expect(result.current.data).toBe(output));
      expect(result.current.error).toBeNull();
    });

    it("should expose a false output", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useFetch(api.negate.$query.setPayload(true))));

      await waitFor(() => expect(result.current.data).toBe(false));
      expect(result.current.loading).toBe(false);
    });

    it("should fetch again when the input changes", async () => {
      const { api } = createApi();

      const { result, rerender } = renderHook(({ id }) => track(useFetch(api.user.byId.$query.setPayload({ id }))), {
        initialProps: { id: 1 },
      });

      await waitFor(() => expect(result.current.data?.name).toBe("John"));
      rerender({ id: 2 });
      await waitFor(() => expect(result.current.data?.name).toBe("Jane"));

      expect(server.requests).toHaveLength(2);
    });

    it("should read the data of a known input from the cache", async () => {
      const { api } = createApi();
      const request = api.user.byId.$query.setPayload({ id: 1 });

      const first = renderHook(() => track(useFetch(request)));
      await waitFor(() => expect(first.result.current.data?.name).toBe("John"));
      first.unmount();

      const second = renderHook(() => track(useFetch(request)));

      expect(second.result.current.data).toStrictEqual({ id: 1, name: "John" });
      expect(server.requests).toHaveLength(1);
    });

    it("should share one request between the components", async () => {
      const { api } = createApi();
      const request = api.user.byId.$query.setPayload({ id: 2 });

      const first = renderHook(() => track(useFetch(request)));
      const second = renderHook(() => track(useFetch(request)));

      await waitFor(() => expect(first.result.current.data?.name).toBe("Jane"));
      await waitFor(() => expect(second.result.current.data?.name).toBe("Jane"));

      expect(server.requests).toHaveLength(1);
    });

    it("should refetch on demand", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useFetch(api.user.list.$query)));

      await waitFor(() => expect(result.current.data).toHaveLength(2));
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => expect(server.requests).toHaveLength(2));
    });

    it("should not fetch when disabled", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useFetch(api.health.$query, { disabled: true })));

      expect(result.current.data).toBeNull();
      expect(server.requests).toHaveLength(0);
    });

    it("should abort a running query", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useFetch(api.held.$query)));

      await gate.started;
      act(() => {
        result.current.abort();
      });

      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
      expect(result.current.data).toBeNull();
    });
  });

  describe("when using useSubmit", () => {
    it("should not call the mutation on mount", () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useSubmit(api.user.create.$mutation)));

      expect(result.current.submitting).toBe(false);
      expect(server.requests).toHaveLength(0);
    });

    it("should call the mutation with the submitted input", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useSubmit(api.user.create.$mutation)));

      let response: Awaited<ReturnType<typeof result.current.submit>> | undefined;
      await act(async () => {
        response = await result.current.submit({ payload: { name: "Jack" } });
      });

      expect(response?.data).toStrictEqual({ id: 3, name: "Jack" });
      expect(result.current.data).toStrictEqual({ id: 3, name: "Jack" });
      expect(result.current.submitting).toBe(false);
      expect(server.requests[0]).toMatchObject({ method: "POST", url: "/user.create" });
    });

    it("should expose the mutation error", async () => {
      const { client } = createApi();
      const request = client.createRequest<{ response: string; payload: string }>()({
        endpoint: "user.byId",
        method: "MUTATION",
      });

      const { result } = renderHook(() => track(useSubmit(request)));

      await act(async () => {
        await result.current.submit({ payload: "value" });
      });

      expect(result.current.status).toBe(405);
      expect(result.current.error).toMatchObject({ data: { code: "METHOD_NOT_SUPPORTED" } });
    });

    it("should call a mutation with a falsy input", async () => {
      const { client } = createApi();
      const request = client.createRequest<{ response: string; payload: string }>()({
        endpoint: "rename",
        method: "MUTATION",
      });

      const { result } = renderHook(() => track(useSubmit(request)));

      await act(async () => {
        await result.current.submit({ payload: "" });
      });

      expect(result.current.data).toBe("");
      expect(result.current.error).toBeNull();
    });

    it("should update a query after the mutation", async () => {
      const { api, client } = createApi();
      const list = api.user.list.$query;

      const fetchHook = renderHook(() => track(useFetch(list)));
      const submitHook = renderHook(() => track(useSubmit(api.user.create.$mutation)));
      await waitFor(() => expect(fetchHook.result.current.data).toHaveLength(2));

      await act(async () => {
        await submitHook.result.current.submit({ payload: { name: "Jack" } });
        await client.cache.update(list, (previous) => ({
          ...previous,
          data: [...(previous?.data ?? []), { id: 3, name: "Jack" }],
        }));
      });

      await waitFor(() => expect(fetchHook.result.current.data).toHaveLength(3));
    });
  });
});
