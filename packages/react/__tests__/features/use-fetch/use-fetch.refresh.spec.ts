import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, waitFor } from "@testing-library/react";

import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Refreshing ]", () => {
  const hookOptions = {
    refresh: true,
    refreshTime: 100,
    refetchBlurred: true,
    refetchOnReconnect: true,
    refetchOnBlur: true,
    refetchOnFocus: true,
  };

  let request = createRequest();

  /**
   * Refreshing is decided by elapsed time, so specs asserting that it stops run on a fake clock. On real timers a slow
   * machine lets the next refresh fire before the hook gets disabled. Each poll moves the clock a little, so a response
   * settles before the clock can reach the next refresh, wherever msw registers its delay timers.
   */
  const useFakeClock = () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  };
  const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
  const advanceUntil = (assertion: () => void) =>
    vi.waitFor(
      async () => {
        await advance(5);
        assertion();
      },
      { interval: 5 },
    );

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    vi.resetModules();
    request = createRequest();
    client.clear();
  });

  it("should refetch data after refresh time of 200ms", async () => {
    const spy = vi.fn();
    mockRequest(request);
    const { result } = renderUseFetch(request, hookOptions);

    act(() => {
      result.current.onRequestStart(spy);
    });

    // Wait for the events instead of fixed sleeps - the timings stretch on a busy machine
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
  it("should refresh blurred tab", async () => {
    const spy = vi.fn();
    mockRequest(request);
    const { result } = renderUseFetch(request, { ...hookOptions, refetchOnBlur: false });

    act(() => {
      result.current.onRequestStart(spy);
      client.appManager.setFocused(false);
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
  it("should not refresh blurred tab", async () => {
    const spy = vi.fn();
    mockRequest(request);
    const { result } = renderUseFetch(request, { ...hookOptions, refetchOnBlur: false, refetchBlurred: false });

    act(() => {
      result.current.onRequestStart(spy);
      client.appManager.setFocused(false);
    });

    await waitForRender();
    await waitForRender(hookOptions.refreshTime * 1.5);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it("should postpone refresh when invalidation is triggered during countdown", async () => {
    // TODO
  });
  it("should postpone refresh when dependencies change during countdown", async () => {
    // TODO
  });
  it("should stop refreshing when value is changing from true to false", async () => {
    useFakeClock();
    const spy = vi.fn();
    mockRequest(request);
    const { result, rerender } = renderUseFetch(request, hookOptions);

    act(() => {
      result.current.onRequestStart(spy);
    });

    await advanceUntil(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });

    act(() => {
      rerender({ refresh: false });
    });

    await advance(hookOptions.refreshTime * 5);

    expect(spy).toHaveBeenCalledTimes(2);
  });
  it("should refetch when tab is focused and refetchOnFocus is true", async () => {
    const spy = vi.fn();
    mockRequest(request);
    // Deduplication would collapse the focus refetch into the still-running initial fetch.
    // Refreshing is off, a timed refresh on a slow machine would add a request the focus did not cause.
    const { result } = renderUseFetch(request.setDeduplicate(false), { ...hookOptions, refresh: false });

    act(() => {
      result.current.onRequestStart(spy);
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    // Simulate tab focus
    act(() => {
      client.appManager.setFocused(true);
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
  it("should not refresh when disabled is true", async () => {
    const spy = vi.fn();
    mockRequest(request);
    const { result } = renderUseFetch(request, { ...hookOptions, disabled: true });

    act(() => {
      result.current.onRequestStart(spy);
    });

    await waitForRender();
    await waitForRender(hookOptions.refreshTime * 1.5);

    expect(spy).not.toHaveBeenCalled();
  });
  it("should stop refreshing when disabled changes from false to true", async () => {
    useFakeClock();
    const spy = vi.fn();
    mockRequest(request);
    const { result, rerender } = renderUseFetch(request, hookOptions);

    act(() => {
      result.current.onRequestStart(spy);
    });

    await advance(0);
    expect(spy).toHaveBeenCalledTimes(1);

    act(() => {
      rerender({ disabled: true });
    });

    await advance(hookOptions.refreshTime * 5);

    expect(spy).toHaveBeenCalledTimes(1);
  });
  it("should not refetch when tab is focused and refetchOnFocus is false", async () => {
    const spy = vi.fn();
    mockRequest(request);
    // Refreshing is off, a timed refresh on a slow machine would add a request the focus did not cause
    const { result } = renderUseFetch(request, {
      ...hookOptions,
      refresh: false,
      refetchOnFocus: false,
    });

    act(() => {
      result.current.onRequestStart(spy);
    });

    await waitForRender();
    expect(spy).toHaveBeenCalledTimes(1);

    // Simulate tab focus
    act(() => {
      client.appManager.setFocused(true);
    });

    await waitForRender();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
