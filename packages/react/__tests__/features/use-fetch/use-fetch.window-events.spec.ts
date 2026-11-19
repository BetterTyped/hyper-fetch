import { act, renderHook } from "@testing-library/react";
import type { UseFetchOptionsType } from "hooks/use-fetch";
import { useFetch } from "hooks/use-fetch";
import { StrictMode } from "react";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, settle } from "../../utils/gate.utils";

type Data = { value: number };
type Options = UseFetchOptionsType<ReturnType<typeof createRequest<Data>>>;

describe("useFetch [ Window Events ]", () => {
  let request = createRequest<Data>();
  let calls = gateRequest(request);

  const renderEvents = (options?: Options, wrapper?: typeof StrictMode) => {
    return renderHook(
      (props: Options) => {
        const { data, loading } = useFetch(request, { ...options, ...props } as Options);
        return { data, loading };
      },
      { initialProps: {}, wrapper },
    );
  };

  const finishInitialRequest = async () => {
    await advance();
    calls[0].succeed({ value: 0 });
    await settle();
  };

  const focus = () => act(() => client.appManager.setFocused(true));
  const blur = () => act(() => client.appManager.setFocused(false));
  const goOnline = () => act(() => client.appManager.setOnline(true));
  const goOffline = () => act(() => client.appManager.setOnline(false));

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<Data>();
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when the window gets focused", () => {
    it("should not refetch by default", async () => {
      renderEvents();
      await finishInitialRequest();

      focus();
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should refetch with refetchOnFocus", async () => {
      const { result } = renderEvents({ refetchOnFocus: true });
      await finishInitialRequest();

      focus();
      await advance();

      expect(calls).toHaveLength(2);
      expect(result.current.loading).toBeTrue();
      expect(result.current.data).toStrictEqual({ value: 0 });
    });
    it("should refetch once per focus event", async () => {
      renderEvents({ refetchOnFocus: true });
      await finishInitialRequest();

      focus();
      await advance();
      calls[1].succeed({ value: 1 });
      await settle();
      focus();
      await advance();

      expect(calls).toHaveLength(3);
    });
    it("should join the running request instead of sending another one", async () => {
      renderEvents({ refetchOnFocus: true });
      await advance();

      focus();
      focus();
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should refetch once in StrictMode", async () => {
      renderEvents({ refetchOnFocus: true }, StrictMode);
      await finishInitialRequest();

      focus();
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should not refetch when disabled", async () => {
      renderEvents({ refetchOnFocus: true, disabled: true });
      await advance();

      focus();
      await advance();

      expect(calls).toHaveLength(0);
    });
    it("should start refetching once refetchOnFocus gets turned on", async () => {
      const { rerender } = renderEvents({ refetchOnFocus: false });
      await finishInitialRequest();

      rerender({ refetchOnFocus: true });
      focus();
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should stop refetching once refetchOnFocus gets turned off", async () => {
      const { rerender } = renderEvents({ refetchOnFocus: true });
      await finishInitialRequest();

      rerender({ refetchOnFocus: false });
      focus();
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should stop refetching once the hook gets disabled", async () => {
      const { rerender } = renderEvents({ refetchOnFocus: true });
      await finishInitialRequest();

      rerender({ disabled: true });
      focus();
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should refetch the current request after the key change", async () => {
      const { rerender } = renderHook(
        ({ page }) => useFetch(request.setQueryParams({ page }), { refetchOnFocus: true }).data,
        { initialProps: { page: 1 } },
      );
      await advance();
      rerender({ page: 2 });
      await advance();
      calls.forEach((call) => call.succeed({ value: 0 }));
      await settle();

      focus();
      await advance();

      expect(calls).toHaveLength(3);
      expect(calls[2].request.queryParams).toStrictEqual({ page: 2 });
    });
    it("should not refetch after unmount", async () => {
      const { unmount } = renderEvents({ refetchOnFocus: true });
      await finishInitialRequest();

      unmount();
      focus();
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should restart the refresh countdown", async () => {
      renderEvents({ refetchOnFocus: true, refresh: true, refreshTime: 10_000 });
      await finishInitialRequest();

      await advance(9000);
      focus();
      await advance();
      calls[1].succeed({ value: 1 });
      await settle();

      await advance(9000);
      expect(calls).toHaveLength(2);

      await advance(1000);
      expect(calls).toHaveLength(3);
    });
  });

  describe("when the window gets blurred", () => {
    it("should not refetch by default", async () => {
      renderEvents();
      await finishInitialRequest();

      blur();
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should refetch with refetchOnBlur", async () => {
      renderEvents({ refetchOnBlur: true });
      await finishInitialRequest();

      blur();
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should not refetch on focus with only refetchOnBlur", async () => {
      renderEvents({ refetchOnBlur: true });
      await finishInitialRequest();

      focus();
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should start refetching once refetchOnBlur gets turned on", async () => {
      const { rerender } = renderEvents();
      await finishInitialRequest();

      rerender({ refetchOnBlur: true });
      blur();
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should not refetch when disabled", async () => {
      renderEvents({ refetchOnBlur: true, disabled: true });
      await advance();

      blur();
      await advance();

      expect(calls).toHaveLength(0);
    });
  });

  describe("when the connection is restored", () => {
    it("should not refetch by default", async () => {
      renderEvents();
      await finishInitialRequest();

      goOffline();
      goOnline();
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should refetch with refetchOnReconnect", async () => {
      renderEvents({ refetchOnReconnect: true });
      await finishInitialRequest();

      goOffline();
      goOnline();
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should not refetch when going offline", async () => {
      renderEvents({ refetchOnReconnect: true });
      await finishInitialRequest();

      goOffline();
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should start refetching once refetchOnReconnect gets turned on", async () => {
      const { rerender } = renderEvents();
      await finishInitialRequest();

      rerender({ refetchOnReconnect: true });
      goOffline();
      goOnline();
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should not refetch when disabled", async () => {
      renderEvents({ refetchOnReconnect: true, disabled: true });
      await advance();

      goOffline();
      goOnline();
      await advance();

      expect(calls).toHaveLength(0);
    });
    it("should send the request mounted offline once online", async () => {
      goOffline();
      const { result } = renderEvents();
      await advance();
      expect(calls).toHaveLength(0);

      goOnline();
      await advance();
      calls[0].succeed({ value: 1 });
      await settle();

      expect(calls).toHaveLength(1);
      expect(result.current.data).toStrictEqual({ value: 1 });
    });
  });
});
