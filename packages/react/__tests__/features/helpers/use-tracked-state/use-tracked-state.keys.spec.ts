import { act, renderHook } from "@testing-library/react";
import type { UseTrackedStateProps } from "helpers";
import { getRequestIdentity, getShouldClearState, useRequestEvents, useTrackedState } from "helpers";
import { isEqual } from "utils";

import { client, createRequest } from "../../../utils";
import { setCacheResponse } from "../../../utils/gate.utils";

type Data = { value: number };

describe("useTrackedState [ Request Keys ]", () => {
  const logger = client.loggerManager.initialize(client, "test");

  const renderTracked = <T extends ReturnType<typeof createRequest<Data>>>(
    initialRequest: T,
    options?: Partial<UseTrackedStateProps<T>>,
  ) => {
    const renders: { key: string; data: unknown; loading: boolean }[] = [];
    const view = renderHook(
      ({ request }: { request: T }) => {
        const tracked = useTrackedState<T>({
          logger,
          request,
          dispatcher: client.fetchDispatcher,
          initialResponse: null,
          deepCompare: isEqual,
          dependencyTracking: false,
          ...options,
        });
        renders.push({ key: request.cacheKey, data: tracked[0].data, loading: tracked[0].loading });
        return tracked;
      },
      { initialProps: { request: initialRequest } },
    );
    return { ...view, renders };
  };

  beforeEach(() => {
    client.clear();
  });

  describe("given getRequestIdentity util", () => {
    it("should be the same for requests differing only by query params", () => {
      const request = createRequest({ endpoint: "/users" as any });

      expect(getRequestIdentity(request.setQueryParams({ page: 1, sort_by: "a" }))).toBe(
        getRequestIdentity(request.setQueryParams({ page: 2, sort_by: "b" })),
      );
    });
    it("should differ for requests with different params", () => {
      const request = createRequest({ endpoint: "/users/:id" as any });

      expect(getRequestIdentity(request.setParams({ id: 1 } as any))).not.toBe(
        getRequestIdentity(request.setParams({ id: 2 } as any)),
      );
    });
    it("should differ for requests with different methods", () => {
      expect(getRequestIdentity(createRequest({ method: "GET" }))).not.toBe(
        getRequestIdentity(createRequest({ method: "POST" })),
      );
    });
    it("should differ for requests with different scopes", () => {
      const request = createRequest();

      expect(getRequestIdentity(request.setScope("a"))).not.toBe(getRequestIdentity(request.setScope("b")));
      expect(getRequestIdentity(request.setScope("a"))).not.toBe(getRequestIdentity(request));
    });
  });

  describe("given getShouldClearState util", () => {
    it("should never clear for the same key", () => {
      expect(getShouldClearState("clean", "GET_/users_", "GET_/users_")).toBeFalse();
      expect(getShouldClearState("auto", "GET_/users_", "GET_/users_")).toBeFalse();
      expect(getShouldClearState("preserve", "GET_/users_", "GET_/users_")).toBeFalse();
    });
    it("should always clear in the clean mode", () => {
      expect(getShouldClearState("clean", 'GET_/users_{"page":1}', 'GET_/users_{"page":2}')).toBeTrue();
    });
    it("should never clear in the preserve mode", () => {
      expect(getShouldClearState("preserve", "GET_/users/1_", "GET_/users/2_")).toBeFalse();
    });
    it("should clear in the auto mode when the endpoint changes", () => {
      expect(getShouldClearState("auto", "GET_/users/1_", "GET_/users/2_")).toBeTrue();
    });
    it("should not clear in the auto mode when only the query params change", () => {
      expect(getShouldClearState("auto", 'GET_/users_{"page":1}', 'GET_/users_{"page":2}')).toBeFalse();
    });
  });

  describe("when the request key changes", () => {
    it("should switch the state during the render with the new key", () => {
      const request = createRequest<Data, any, "/items/:id">({ endpoint: "/items/:id" });
      setCacheResponse(request.setParams({ id: 1 }), { value: 1 });
      const { rerender, renders } = renderTracked(request.setParams({ id: 1 }) as any);

      rerender({ request: request.setParams({ id: 2 }) as any });

      const rendersOfNewKey = renders.filter((render) => render.key === request.setParams({ id: 2 }).cacheKey);
      expect(rendersOfNewKey.map((render) => render.data)).toStrictEqual(rendersOfNewKey.map(() => null));
    });
    it("should use the cache of the new key during the render with it", () => {
      const request = createRequest<Data, any, "/items/:id">({ endpoint: "/items/:id" });
      setCacheResponse(request.setParams({ id: 1 }), { value: 1 });
      setCacheResponse(request.setParams({ id: 2 }), { value: 2 });
      const { rerender, renders } = renderTracked(request.setParams({ id: 1 }) as any);

      rerender({ request: request.setParams({ id: 2 }) as any });

      const firstRenderOfNewKey = renders.find((render) => render.key === request.setParams({ id: 2 }).cacheKey);
      expect(firstRenderOfNewKey?.data).toStrictEqual({ value: 2 });
    });
    it("should keep the state for the query params change in the auto mode", () => {
      const request = createRequest<Data>();
      setCacheResponse(request.setQueryParams({ page_number: 1 }), { value: 1 });
      const { rerender, result } = renderTracked(request.setQueryParams({ page_number: 1 }) as any);

      rerender({ request: request.setQueryParams({ page_number: 2 }) as any });

      expect(result.current[0].data).toStrictEqual({ value: 1 });
    });
    it("should clear the state for the query params change in the clean mode", () => {
      const request = createRequest<Data>();
      setCacheResponse(request.setQueryParams({ page: 1 }), { value: 1 });
      const { rerender, result } = renderTracked(request.setQueryParams({ page: 1 }) as any, {
        keepPreviousData: "clean",
      });

      rerender({ request: request.setQueryParams({ page: 2 }) as any });

      expect(result.current[0].data).toBeNull();
    });
    it("should keep the state for the params change in the preserve mode", () => {
      const request = createRequest<Data, any, "/items/:id">({ endpoint: "/items/:id" });
      setCacheResponse(request.setParams({ id: 1 }), { value: 1 });
      const { rerender, result } = renderTracked(request.setParams({ id: 1 }) as any, {
        keepPreviousData: "preserve",
      });

      rerender({ request: request.setParams({ id: 2 }) as any });

      expect(result.current[0].data).toStrictEqual({ value: 1 });
    });
    it("should not replace the kept state with the initial response", () => {
      const request = createRequest<Data>();
      setCacheResponse(request.setQueryParams({ page: 1 }), { value: 1 });
      const { rerender, result } = renderTracked(request.setQueryParams({ page: 1 }) as any, {
        initialResponse: { data: { value: 0 } },
      });

      rerender({ request: request.setQueryParams({ page: 2 }) as any });

      expect(result.current[0].data).toStrictEqual({ value: 1 });
    });
    it("should use the initial response for the cleared state", () => {
      const request = createRequest<Data>();
      setCacheResponse(request.setQueryParams({ page: 1 }), { value: 1 });
      const { rerender, result } = renderTracked(request.setQueryParams({ page: 1 }) as any, {
        initialResponse: { data: { value: 0 } },
        keepPreviousData: "clean",
      });

      rerender({ request: request.setQueryParams({ page: 2 }) as any });

      expect(result.current[0].data).toStrictEqual({ value: 0 });
    });
  });

  describe("when actions are used", () => {
    it("should keep the identity of the actions between renders", () => {
      const request = createRequest<Data>();
      const { rerender, result } = renderTracked(request as any);
      const actions = result.current[1];

      rerender({ request: request.setQueryParams({ page: 2 }) as any });

      expect(result.current[1]).toBe(actions);
    });
    it("should pass the status 0 to the updater", () => {
      const request = createRequest<Data>();
      const { result } = renderTracked(request as any);
      const updater = vi.fn((previous: number | null) => (previous === 0 ? 500 : 200));

      act(() => {
        result.current[1].setStatus(0 as any);
      });
      act(() => {
        result.current[1].setStatus(updater as any);
      });

      expect(updater).toHaveBeenCalledExactlyOnceWith(0);
      expect(result.current[0].status).toBe(500);
    });
  });

  describe("when used with useRequestEvents", () => {
    const renderEvents = (request: ReturnType<typeof createRequest<Data>>) => {
      return renderHook(() => {
        const [state, actions, { setCacheData, getIsDataProcessing }] = useTrackedState({
          logger,
          request,
          dispatcher: client.fetchDispatcher,
          initialResponse: null,
          deepCompare: isEqual,
          dependencyTracking: false,
        });
        const [callbacks, listeners] = useRequestEvents({
          logger,
          actions,
          request,
          dispatcher: client.fetchDispatcher,
          setCacheData,
          getIsDataProcessing,
        });
        return { state, callbacks, listeners };
      });
    };

    it("should keep the identity of the callbacks between renders", () => {
      const { result, rerender } = renderEvents(createRequest<Data>());
      const { callbacks } = result.current;

      rerender();

      expect(result.current.callbacks).toBe(callbacks);
    });
    it("should receive the cache data of the listened request", () => {
      const request = createRequest<Data>();
      const { result } = renderEvents(request);

      act(() => {
        result.current.listeners.addCacheDataListener(request);
        setCacheResponse(request, { value: 1 });
      });

      expect(result.current.state.data).toStrictEqual({ value: 1 });
    });
    it("should ignore the cache data of another scope", () => {
      const request = createRequest<Data>();
      const { result } = renderEvents(request);

      act(() => {
        result.current.listeners.addCacheDataListener(request);
        setCacheResponse(request.setScope("other"), { value: 1 });
      });

      expect(result.current.state.data).toBeNull();
    });
    it("should receive the cache data of the request listened with a scope", () => {
      const request = createRequest<Data>().setScope("mine");
      const { result } = renderEvents(request);

      act(() => {
        result.current.listeners.addCacheDataListener(request);
        setCacheResponse(request, { value: 1 });
      });

      expect(result.current.state.data).toStrictEqual({ value: 1 });
    });
    it("should follow the loading events of the scoped request", () => {
      const request = createRequest<Data>().setScope("mine");
      const { result } = renderEvents(request);

      act(() => {
        result.current.listeners.addCacheDataListener(request);
        client.requestManager.events.emitLoading({
          request,
          requestId: "1",
          loading: true,
          isRetry: false,
          isOffline: false,
        });
      });

      expect(result.current.state.loading).toBeTrue();
    });
    it("should ignore the loading events of another scope", () => {
      const request = createRequest<Data>();
      const { result } = renderEvents(request.setScope("mine"));

      act(() => {
        result.current.listeners.addCacheDataListener(request.setScope("mine"));
        client.requestManager.events.emitLoading({
          request: request.setScope("other"),
          requestId: "1",
          loading: true,
          isRetry: false,
          isOffline: false,
        });
      });

      expect(result.current.state.loading).toBeFalse();
    });
  });
});
