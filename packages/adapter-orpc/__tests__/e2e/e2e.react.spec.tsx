/**
 * @vitest-environment jsdom
 */
import { createClient, createSdk } from "@hyper-fetch/core";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import type { OrpcSchema } from "../../src/adapter";
import { OrpcAdapter } from "../../src/adapter";
import type { AppRouter, Gate } from "./e2e.orpc-server";
import { createAppRouter, createE2EOrpcServer, createGate } from "./e2e.orpc-server";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

/** Hooks re-render only for the fields read during the render */
const track = <T extends Record<string, any>>(hook: T) => {
  ["data", "error", "status", "loading", "submitting"].forEach((field) => hook[field]);
  return hook;
};

describe("Orpc Adapter [ React ]", () => {
  let gate: Gate = createGate();
  let server = createE2EOrpcServer(createAppRouter(() => gate));
  let url = "";

  const createApi = () => {
    const client = createClient({ url: `${url}/rpc`, mode: "client" }).setAdapter(OrpcAdapter());
    return { client, api: createSdk<typeof client, OrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false }) };
  };

  // Every test gets its own server, so requests of the previous test can't be counted
  beforeEach(async () => {
    gate = createGate();
    server = createE2EOrpcServer(createAppRouter(() => gate));
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

    it("should expose the defined error", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useFetch(api.user.byId.$query.setPayload({ id: 999 }))));

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.data).toBeNull();
      expect(result.current.status).toBe(404);
      expect(result.current.error).toStrictEqual({
        defined: true,
        code: "NOT_FOUND",
        status: 404,
        message: "User not found",
        data: { id: 999 },
      });
    });

    it("should expose the special types of the output", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useFetch(api.types.epoch.$query)));

      await waitFor(() => expect(result.current.data).toStrictEqual({ at: new Date(0), tags: new Set(["a"]) }));
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

    it("should not fetch when disabled", () => {
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

      expect(result.current.data).toBeNull();
      expect(server.requests).toHaveLength(0);
    });

    it("should call the mutation with the submitted input", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useSubmit(api.user.create.$mutation)));

      let response: Awaited<ReturnType<typeof result.current.submit>> | null = null;
      await act(async () => {
        response = await result.current.submit({ payload: { name: "Jack" } });
      });

      expect(response).toMatchObject({ data: { id: 3, name: "Jack" }, success: true });
      await waitFor(() => expect(result.current.data).toStrictEqual({ id: 3, name: "Jack" }));
      expect(server.requests).toStrictEqual([
        { method: "POST", url: "/rpc/user/create", contentType: "application/json" },
      ]);
    });

    it("should expose the mutation error", async () => {
      const { api } = createApi();

      const { result } = renderHook(() => track(useSubmit(api.fail.$mutation)));

      await act(async () => {
        await result.current.submit({ payload: { code: "CONFLICT" } });
      });

      await waitFor(() => expect(result.current.error).toMatchObject({ code: "CONFLICT", status: 409 }));
      expect(result.current.data).toBeNull();
    });

    it("should update a query after the mutation", async () => {
      const { api, client } = createApi();
      const listRequest = api.user.list.$query;

      const fetchHook = renderHook(() => track(useFetch(listRequest)));
      const submitHook = renderHook(() => track(useSubmit(api.user.create.$mutation)));
      await waitFor(() => expect(fetchHook.result.current.data).toHaveLength(2));

      await act(async () => {
        await submitHook.result.current.submit({ payload: { name: "Jack" } });
        client.cache.update(listRequest, (cache) => ({
          ...cache,
          data: [...(cache?.data ?? []), { id: 3, name: "Jack" }],
        }));
      });

      await waitFor(() => expect(fetchHook.result.current.data).toHaveLength(3));
    });
  });
});
