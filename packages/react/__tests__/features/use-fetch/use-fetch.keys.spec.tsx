import { act, renderHook } from "@testing-library/react";
import type { UseFetchOptionsType } from "hooks/use-fetch";
import { useFetch } from "hooks/use-fetch";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

type User = { id: number };
type Render = { id: number; data: User | null; loading: boolean; error: string | null };

describe("useFetch [ Request Keys ]", () => {
  let userRequest = createRequest<User, any, "/users/:id">({ endpoint: "/users/:id" });
  let calls = gateRequest(userRequest);

  /**
   * Renders useFetch for the user of the given id and records every render with the id it was rendered for
   */
  const renderUser = (
    initialId: number,
    options?: UseFetchOptionsType<ReturnType<(typeof userRequest)["setParams"]>>,
  ) => {
    const renders: Render[] = [];
    const view = renderHook(
      ({ id, ...rest }: { id: number } & UseFetchOptionsType<ReturnType<(typeof userRequest)["setParams"]>>) => {
        const state = useFetch(userRequest.setParams({ id }), { ...options, ...rest } as typeof options);
        renders.push({
          id,
          data: state.data as User | null,
          loading: state.loading,
          error: state.error?.message ?? null,
        });
        return state;
      },
      {
        initialProps: { id: initialId } as { id: number } & UseFetchOptionsType<
          ReturnType<(typeof userRequest)["setParams"]>
        >,
      },
    );
    return { ...view, renders };
  };

  const callFor = (id: number) => {
    const call = calls.find((item) => item.request.endpoint === `/users/${id}`);
    if (!call) {
      throw new Error(`Request for user ${id} was not sent`);
    }
    return call;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    userRequest = createRequest<User, any, "/users/:id">({ endpoint: "/users/:id" });
    calls = gateRequest(userRequest);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when params change to another resource", () => {
    it("should never render the data of the previous resource", async () => {
      const { rerender, renders } = renderUser(1);
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      rerender({ id: 2 });
      await advance();
      callFor(2).succeed({ id: 2 });
      await settle();

      const mismatched = renders.filter((render) => render.data !== null && render.data.id !== render.id);
      expect(mismatched).toStrictEqual([]);
    });
    it("should be in the loading state on the first render with the new key", async () => {
      const { rerender, renders } = renderUser(1);
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      rerender({ id: 2 });

      const firstRenderOfNewKey = renders.find((render) => render.id === 2);
      expect(firstRenderOfNewKey).toStrictEqual({ id: 2, data: null, loading: true, error: null });
    });
    it("should not show the error of the previous resource", async () => {
      const { rerender, renders } = renderUser(1);
      await advance();
      callFor(1).fail(new Error("User 1 failed"));
      await settle();

      rerender({ id: 2 });
      await advance();

      const rendersOfNewKey = renders.filter((render) => render.id === 2);
      expect(rendersOfNewKey.every((render) => render.error === null)).toBeTrue();
    });
    it("should send one request per resource", async () => {
      const { rerender } = renderUser(1);
      await advance();
      rerender({ id: 2 });
      await advance();
      rerender({ id: 3 });
      await advance();

      expect(calls.map((call) => call.request.endpoint)).toStrictEqual(["/users/1", "/users/2", "/users/3"]);
    });
    it("should show cached data of the new key on the first render with it", async () => {
      setCacheResponse(userRequest.setParams({ id: 2 }), { id: 2 });
      const { rerender, renders } = renderUser(1);
      await advance();

      rerender({ id: 2 });

      const firstRenderOfNewKey = renders.find((render) => render.id === 2);
      expect(firstRenderOfNewKey?.data).toStrictEqual({ id: 2 });
    });
    it("should not refetch fresh cached data of the new key when revalidate is off", async () => {
      setCacheResponse(userRequest.setParams({ id: 2 }), { id: 2 });
      const { rerender, result } = renderUser(1, { revalidate: false });
      await advance();

      rerender({ id: 2 });
      await advance();

      expect(calls.map((call) => call.request.endpoint)).toStrictEqual(["/users/1"]);
      expect(result.current.loading).toBeFalse();
    });
    it("should refetch cached data of the new key by default", async () => {
      setCacheResponse(userRequest.setParams({ id: 2 }), { id: 2 });
      const { rerender } = renderUser(1);
      await advance();

      rerender({ id: 2 });
      await advance();

      expect(calls.map((call) => call.request.endpoint)).toStrictEqual(["/users/1", "/users/2"]);
    });
    it("should reuse the data reference when coming back to the cached key", async () => {
      const { rerender, result } = renderUser(1, { revalidate: false });
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();
      const firstUser = result.current.data;

      rerender({ id: 2 });
      await advance();
      callFor(2).succeed({ id: 2 });
      await settle();
      rerender({ id: 1 });

      expect(result.current.data).toBe(firstUser);
      expect(calls).toHaveLength(2);
    });
  });

  describe("when responses arrive out of order", () => {
    it("should ignore the late response of the previous key", async () => {
      const { rerender, result } = renderUser(1);
      await advance();
      rerender({ id: 2 });
      await advance();

      callFor(2).succeed({ id: 2 });
      await settle();
      callFor(1).succeed({ id: 1 });
      await settle();

      expect(result.current.data).toStrictEqual({ id: 2 });
      expect(result.current.loading).toBeFalse();
    });
    it("should still cache the late response under its own key", async () => {
      const { rerender } = renderUser(1);
      await advance();
      rerender({ id: 2 });
      await advance();

      callFor(2).succeed({ id: 2 });
      await settle();
      callFor(1).succeed({ id: 1 });
      await settle();

      expect(client.cache.get(userRequest.setParams({ id: 1 }).cacheKey)?.data).toStrictEqual({ id: 1 });
      expect(client.cache.get(userRequest.setParams({ id: 2 }).cacheKey)?.data).toStrictEqual({ id: 2 });
    });
    it("should ignore the late error of the previous key", async () => {
      const { rerender, result } = renderUser(1);
      await advance();
      rerender({ id: 2 });
      await advance();

      callFor(2).succeed({ id: 2 });
      await settle();
      callFor(1).fail(new Error("Late error"));
      await settle();

      expect(result.current.error).toBeNull();
      expect(result.current.data).toStrictEqual({ id: 2 });
    });
    it("should stay in loading state when only the previous key responds", async () => {
      const { rerender, result } = renderUser(1);
      await advance();
      rerender({ id: 2 });
      await advance();

      callFor(1).succeed({ id: 1 });
      await settle();

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBeTrue();
    });
  });

  describe("when keys are switched rapidly", () => {
    it("should end up with the data of the last key", async () => {
      const { rerender, result } = renderUser(1);
      [2, 3, 4, 5].forEach((id) => rerender({ id }));
      await advance();

      // Answer in reversed order - the last key answers first
      [5, 4, 3, 2, 1].forEach((id) => callFor(id).succeed({ id }));
      await settle();

      expect(result.current.data).toStrictEqual({ id: 5 });
      expect(result.current.loading).toBeFalse();
    });
    it("should never render data of a key other than the current one", async () => {
      const { rerender, renders } = renderUser(1);
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      for (const id of [2, 3, 4]) {
        rerender({ id });
        // eslint-disable-next-line no-await-in-loop
        await advance();
        callFor(id).succeed({ id });
        // eslint-disable-next-line no-await-in-loop
        await settle();
      }

      const mismatched = renders.filter((render) => render.data !== null && render.data.id !== render.id);
      expect(mismatched).toStrictEqual([]);
    });
    it("should show cached data when toggling between two cached keys", async () => {
      const { rerender, result } = renderUser(1, { revalidate: false });
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();
      rerender({ id: 2 });
      await advance();
      callFor(2).succeed({ id: 2 });
      await settle();

      for (const id of [1, 2, 1, 2]) {
        rerender({ id });
        expect(result.current.data).toStrictEqual({ id });
      }
      expect(calls).toHaveLength(2);
    });
  });

  describe("when the request is recreated without changes", () => {
    it("should not refetch when rerendered with an equal request instance", async () => {
      const { rerender } = renderUser(1);
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      rerender({ id: 1 });
      rerender({ id: 1 });
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should keep the data when rerendered with an equal request instance", async () => {
      const { rerender, result } = renderUser(1);
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();
      const { data } = result.current;

      rerender({ id: 1 });

      expect(result.current.data).toBe(data);
    });
  });

  describe("when query params change", () => {
    const listRequest = () => createRequest<{ page: number }, any, "/users">({ endpoint: "/users" });

    it("should give every query its own cache key", async () => {
      const request = listRequest();

      const keys = [1, 2, 3].map((page) => request.setQueryParams({ page }).cacheKey);

      expect(new Set(keys).size).toBe(3);
    });
    it("should keep the previous data when the query params contain underscores", async () => {
      const request = listRequest();
      const listCalls = gateRequest(request);
      const renders: { page: number; data: { page: number } | null }[] = [];
      const { rerender } = renderHook(
        ({ page }) => {
          const { data } = useFetch(request.setQueryParams({ page, sort_by: "created_at", per_page: 10 }));
          renders.push({ page, data });
          return data;
        },
        { initialProps: { page: 1 } },
      );
      await advance();
      listCalls[0].succeed({ page: 1 });
      await settle();

      rerender({ page: 2 });
      await advance();

      // "auto" mode keeps the data of the same resource - only its query changed
      expect(renders.filter((render) => render.page === 2).map((render) => render.data)).toStrictEqual(
        renders.filter((render) => render.page === 2).map(() => ({ page: 1 })),
      );

      listCalls[1].succeed({ page: 2 });
      await settle();

      expect(renders.at(-1)).toStrictEqual({ page: 2, data: { page: 2 } });
    });
    it("should keep the previous data when the query params are a string with underscores", async () => {
      const request = listRequest();
      const listCalls = gateRequest(request);
      const { rerender, result } = renderHook(
        ({ search }) => {
          const { data } = useFetch(request.setQueryParams(`?search=${search}` as any));
          return { data };
        },
        { initialProps: { search: "john_doe" } },
      );
      await advance();
      listCalls[0].succeed({ page: 1 });
      await settle();

      rerender({ search: "jane_doe" });

      expect(result.current.data).toStrictEqual({ page: 1 });
    });
    it("should clear the data when the endpoint contains underscores and the resource changes", async () => {
      const request = createRequest<User, any, "/user_profiles/:id">({ endpoint: "/user_profiles/:id" });
      const profileCalls = gateRequest(request);
      const { rerender, result } = renderHook(
        ({ id }) => {
          const { data } = useFetch(request.setParams({ id }).setQueryParams({ include_details: true }));
          return { data };
        },
        { initialProps: { id: 1 } },
      );
      await advance();
      profileCalls[0].succeed({ id: 1 });
      await settle();

      rerender({ id: 2 });

      expect(result.current.data).toBeNull();
    });
    it("should send a request for the new query", async () => {
      const request = listRequest();
      const listCalls = gateRequest(request);
      const { rerender } = renderHook(({ page }) => useFetch(request.setQueryParams({ page })).data, {
        initialProps: { page: 1 },
      });
      await advance();
      rerender({ page: 2 });
      await advance();

      expect(listCalls.map((call) => call.request.queryParams)).toStrictEqual([{ page: 1 }, { page: 2 }]);
    });
  });

  describe("when the payload changes", () => {
    it("should refetch and keep the data of the same cache key", async () => {
      const request = createRequest<{ total: number }, { filter: string }>({ method: "QUERY" as any });
      const queryCalls = gateRequest(request);
      const { rerender, result } = renderHook(
        ({ filter }) => {
          const { data, loading } = useFetch(request.setPayload({ filter }));
          return { data, loading };
        },
        { initialProps: { filter: "a" } },
      );
      await advance();
      queryCalls[0].succeed({ total: 1 });
      await settle();

      rerender({ filter: "b" });
      await advance();

      expect(queryCalls).toHaveLength(2);
      expect(queryCalls[1].request.payload).toStrictEqual({ filter: "b" });
      expect(result.current.data).toStrictEqual({ total: 1 });
      expect(result.current.loading).toBeTrue();
    });
  });

  describe("when dependencies change", () => {
    it("should refetch", async () => {
      const { rerender } = renderUser(1, { dependencies: ["a"] });
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      rerender({ id: 1, dependencies: ["b"] });
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should not refetch when dependencies stay the same", async () => {
      const { rerender } = renderUser(1, { dependencies: ["a", 1] });
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      rerender({ id: 1, dependencies: ["a", 1] });
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should compare dependencies by identity", async () => {
      const dependency = { value: 1 };
      const { rerender } = renderUser(1, { dependencies: [dependency] });
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      rerender({ id: 1, dependencies: [dependency] });
      await advance();
      expect(calls).toHaveLength(1);

      rerender({ id: 1, dependencies: [{ value: 1 }] });
      await advance();
      expect(calls).toHaveLength(2);
    });
    it("should not refetch fresh data when revalidate is off", async () => {
      const { rerender } = renderUser(1, { dependencies: ["a"], revalidate: false });
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      rerender({ id: 1, dependencies: ["b"], revalidate: false });
      await advance();

      expect(calls).toHaveLength(1);
    });
  });

  describe("when disabled changes", () => {
    it("should fetch once enabled", async () => {
      const { rerender, result } = renderUser(1, { disabled: true });
      await advance();
      expect(calls).toHaveLength(0);

      rerender({ id: 1, disabled: false });
      await advance();
      expect(calls).toHaveLength(1);

      callFor(1).succeed({ id: 1 });
      await settle();
      expect(result.current.data).toStrictEqual({ id: 1 });
    });
    it("should keep the data once disabled", async () => {
      const { rerender, result } = renderUser(1);
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      rerender({ id: 1, disabled: true });
      await advance();

      expect(result.current.data).toStrictEqual({ id: 1 });
      expect(result.current.loading).toBeFalse();
      expect(calls).toHaveLength(1);
    });
    it("should not fetch the new key when it is switched together with disabling", async () => {
      const { rerender } = renderUser(1);
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      rerender({ id: 2, disabled: true });
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should not be in the loading state for the disabled new key", async () => {
      const { rerender, result } = renderUser(1);
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      rerender({ id: 2, disabled: true });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBeFalse();
    });
    it("should fetch the dependent request once its param is known", async () => {
      const { rerender, result } = renderHook(
        ({ id }: { id: number | null }) => {
          const { data, loading } = useFetch(userRequest.setParams({ id: id ?? 0 }), { disabled: id === null });
          return { data, loading };
        },
        { initialProps: { id: null as number | null } },
      );
      await advance();
      expect(calls).toHaveLength(0);
      expect(result.current.loading).toBeFalse();

      rerender({ id: 7 });
      await advance();
      callFor(7).succeed({ id: 7 });
      await settle();

      expect(calls).toHaveLength(1);
      expect(result.current.data).toStrictEqual({ id: 7 });
    });
    it("should refetch after enabling a request that failed before", async () => {
      const { rerender, result } = renderUser(1);
      await advance();
      callFor(1).fail(new Error("Failed"));
      await settle();

      rerender({ id: 1, disabled: true });
      rerender({ id: 1, disabled: false });
      await advance();
      calls[1].succeed({ id: 1 });
      await settle();

      expect(result.current.error).toBeNull();
      expect(result.current.data).toStrictEqual({ id: 1 });
    });
  });

  describe("when the key changes after a local update", () => {
    it("should drop the data set with setData", async () => {
      const { rerender, result } = renderUser(1);
      await advance();
      callFor(1).succeed({ id: 1 });
      await settle();

      act(() => {
        result.current.setData({ id: 100 });
      });
      expect(result.current.data).toStrictEqual({ id: 100 });

      rerender({ id: 2 });

      expect(result.current.data).toBeNull();
    });
  });
});
