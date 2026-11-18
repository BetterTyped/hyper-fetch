import { act, renderHook } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import type { UseIsFetchingOptionsType } from "hooks/use-is-fetching";
import { useIsFetching, useIsSubmitting } from "hooks/use-is-fetching";
import { StrictMode } from "react";
import { expectTypeOf } from "vitest";

import { client, createRequest } from "../../utils";
import { advance, countListeners, gateRequest, settle } from "../../utils/gate.utils";

type Data = { value: number };

describe("useIsFetching [ Lifecycle ]", () => {
  let request = createRequest<Data, any, "/items/:id">({ endpoint: "/items/:id" });
  let calls = gateRequest(request);

  const item = (id: number) => request.setParams({ id });

  const renderCounter = (options?: UseIsFetchingOptionsType, wrapper?: typeof StrictMode) => {
    const counter = { renders: 0 };
    const view = renderHook(
      (props: UseIsFetchingOptionsType | undefined) => {
        counter.renders += 1;
        return useIsFetching(client, props);
      },
      { initialProps: options, wrapper },
    );
    return { ...view, counter };
  };

  const send = (id: number) => {
    act(() => {
      client.fetchDispatcher.add(item(id));
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<Data, any, "/items/:id">({ endpoint: "/items/:id" });
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when requests are running", () => {
    it("should return zero when nothing is running", () => {
      const { result } = renderCounter();

      expect(result.current).toBe(0);
    });
    it("should count the request from its start to the response", async () => {
      const { result } = renderCounter();

      send(1);
      expect(result.current).toBe(1);

      await advance();
      calls[0].succeed({ value: 1 });
      await settle();

      expect(result.current).toBe(0);
    });
    it("should count the request until the error response", async () => {
      const { result } = renderCounter();

      send(1);
      await advance();
      calls[0].fail();
      await settle();

      expect(result.current).toBe(0);
    });
    it("should count requests of different keys", async () => {
      const { result } = renderCounter();

      send(1);
      send(2);
      send(3);
      expect(result.current).toBe(3);

      await advance();
      calls[1].succeed({ value: 2 });
      await settle();

      expect(result.current).toBe(2);
    });
    it("should count the deduplicated requests once", () => {
      const { result } = renderCounter();

      send(1);
      send(1);
      send(1);

      expect(result.current).toBe(1);
    });
    it("should count the requests started before the hook mounted", () => {
      send(1);
      send(2);

      const { result } = renderCounter();

      expect(result.current).toBe(2);
    });
    it("should count the requests of the useFetch hooks", async () => {
      const { result } = renderCounter();
      renderHook(() => useFetch(item(1)).data);
      renderHook(() => useFetch(item(1)).data);
      renderHook(() => useFetch(item(2)).data);

      expect(result.current).toBe(2);

      await advance();
      calls.forEach((call) => call.succeed({ value: 1 }));
      await settle();

      expect(result.current).toBe(0);
    });
    it("should keep counting the request of the unmounted hook until it finishes", async () => {
      const { result } = renderCounter();
      const { unmount } = renderHook(() => useFetch(item(1)).data);
      await advance();

      unmount();
      expect(result.current).toBe(1);

      calls[0].succeed({ value: 1 });
      await settle();

      expect(result.current).toBe(0);
    });
    it("should not count the canceled request", async () => {
      const { result } = renderCounter();
      send(1);
      await advance();

      act(() => {
        client.fetchDispatcher.cancelRunningRequests(item(1).queryKey);
      });

      expect(result.current).toBe(0);
    });
    it("should not count the request waiting for the connection", async () => {
      const { result } = renderCounter();
      act(() => {
        client.appManager.setOnline(false);
      });

      send(1);
      expect(result.current).toBe(0);

      act(() => {
        client.appManager.setOnline(true);
      });
      expect(result.current).toBe(1);
    });
    it("should not count the request waiting for the retry", async () => {
      const retried = createRequest<Data>({ retry: 1, retryTime: 5000 });
      const retriedCalls = gateRequest(retried);
      const { result } = renderCounter();
      act(() => {
        client.fetchDispatcher.add(retried);
      });
      await advance();

      retriedCalls[0].fail();
      await settle();
      expect(result.current).toBe(0);

      await advance(5000);
      expect(result.current).toBe(1);
    });
    it("should not count the submit requests", () => {
      const submit = createRequest<Data>({ method: "POST" });
      gateRequest(submit);
      const { result } = renderCounter();
      const submitting = renderHook(() => useIsSubmitting(client));

      act(() => {
        client.submitDispatcher.add(submit);
      });

      expect(result.current).toBe(0);
      expect(submitting.result.current).toBe(1);
    });
  });

  describe("when filters are used", () => {
    it("should count only the requests with the given query key", () => {
      const { result } = renderCounter({ queryKey: item(1).queryKey });

      send(1);
      send(2);

      expect(result.current).toBe(1);
    });
    it("should count only the requests matching the RegExp", () => {
      const { result } = renderCounter({ queryKey: /items\/[12]_/ });

      send(1);
      send(2);
      send(3);

      expect(result.current).toBe(2);
    });
    it("should count only the requests accepted by the predicate", () => {
      const { result } = renderCounter({
        predicate: (running) => (running.params as unknown as { id: number }).id === 3,
      });

      send(1);
      send(3);

      expect(result.current).toBe(1);
    });
    it("should combine the query key with the predicate", () => {
      const { result } = renderCounter({
        queryKey: /items/,
        predicate: (running) => (running.params as unknown as { id: number }).id !== 1,
      });

      send(1);
      send(2);

      expect(result.current).toBe(1);
    });
    it("should apply the filters changed between renders", () => {
      const { result, rerender } = renderCounter({ queryKey: item(1).queryKey });
      send(1);
      send(2);
      send(3);
      expect(result.current).toBe(1);

      rerender({});
      expect(result.current).toBe(3);

      rerender({ queryKey: "unknown" });
      expect(result.current).toBe(0);
    });
  });

  describe("when the count does not change", () => {
    it("should not rerender for the requests filtered out", async () => {
      const { counter } = renderCounter({ queryKey: item(1).queryKey });

      send(2);
      await advance();
      calls[0].succeed({ value: 2 });
      await settle();

      expect(counter.renders).toBe(1);
    });
    it("should render once per count change", async () => {
      const { counter } = renderCounter();

      send(1);
      await advance();
      calls[0].succeed({ value: 1 });
      await settle();

      // 0 -> 1 -> 0
      expect(counter.renders).toBe(3);
    });
  });

  describe("when rendered in StrictMode", () => {
    it("should count the running requests", async () => {
      const { result } = renderCounter(undefined, StrictMode);

      send(1);
      expect(result.current).toBe(1);

      await advance();
      calls[0].succeed({ value: 1 });
      await settle();

      expect(result.current).toBe(0);
    });
    it("should remove the listeners after unmount", () => {
      const baseline = countListeners(client);
      const { unmount } = renderCounter(undefined, StrictMode);

      unmount();

      expect(countListeners(client)).toStrictEqual(baseline);
    });
  });

  describe("when checking the types", () => {
    it("should return a number", () => {
      expectTypeOf(useIsFetching).returns.toEqualTypeOf<number>();
      expectTypeOf(useIsSubmitting).returns.toEqualTypeOf<number>();
    });
    it("should accept the client and optional filters", () => {
      expectTypeOf(useIsFetching).parameter(1).toEqualTypeOf<UseIsFetchingOptionsType | undefined>();
      expectTypeOf<UseIsFetchingOptionsType["queryKey"]>().toEqualTypeOf<string | RegExp | undefined>();
    });
  });
});
