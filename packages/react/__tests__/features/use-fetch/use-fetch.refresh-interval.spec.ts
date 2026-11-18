import { act, renderHook } from "@testing-library/react";
import type { UseFetchOptionsType } from "hooks/use-fetch";
import { useFetch } from "hooks/use-fetch";
import { StrictMode } from "react";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, settle } from "../../utils/gate.utils";

type Data = { value: number };
type Options = UseFetchOptionsType<ReturnType<typeof createRequest<Data>>>;

const refreshTime = 10_000;

describe("useFetch [ Refresh Interval ]", () => {
  let request = createRequest<Data>();
  let calls = gateRequest(request);

  const renderRefresh = (options?: Options, wrapper?: typeof StrictMode) => {
    return renderHook(
      (props: Options) => {
        const { data, refetch } = useFetch(request, { refresh: true, refreshTime, ...options, ...props } as Options);
        return { data, refetch };
      },
      { initialProps: {}, wrapper },
    );
  };

  /** Answers every pending call, so the next interval is free to send a request */
  const answerAll = async () => {
    calls.forEach((call, index) => call.succeed({ value: index }));
    await settle();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<Data>();
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when refresh is enabled", () => {
    it("should not refresh before the refresh time passes", async () => {
      renderRefresh();
      await advance();
      await answerAll();

      await advance(refreshTime - 1000);

      expect(calls).toHaveLength(1);
    });
    it("should refresh once the refresh time passes", async () => {
      renderRefresh();
      await advance();
      await answerAll();

      await advance(refreshTime);

      expect(calls).toHaveLength(2);
    });
    it("should refresh once per interval", async () => {
      renderRefresh();
      await advance();
      await answerAll();

      for (let i = 0; i < 4; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await advance(refreshTime);
        // eslint-disable-next-line no-await-in-loop
        await answerAll();
      }

      expect(calls).toHaveLength(5);
    });
    it("should update the data with every refresh", async () => {
      const { result } = renderRefresh();
      await advance();
      calls[0].succeed({ value: 1 });
      await settle();

      await advance(refreshTime);
      calls[1].succeed({ value: 2 });
      await settle();

      expect(result.current.data).toStrictEqual({ value: 2 });
    });
    it("should not stack requests while the previous one is still running", async () => {
      renderRefresh();
      await advance();

      await advance(refreshTime * 3);

      expect(calls).toHaveLength(1);
    });
    it("should keep a single timer running", async () => {
      renderRefresh();
      await advance();
      await answerAll();
      const timers = vi.getTimerCount();

      await advance(refreshTime);
      await answerAll();
      await advance(refreshTime);
      await answerAll();

      expect(vi.getTimerCount()).toBe(timers);
    });
    it("should keep a single timer in StrictMode", async () => {
      renderRefresh({}, StrictMode);
      await advance();
      await answerAll();

      await advance(refreshTime);

      expect(calls).toHaveLength(2);
    });
    it("should not refresh without the refresh option", async () => {
      renderRefresh({ refresh: false });
      await advance();
      await answerAll();

      await advance(refreshTime * 3);

      expect(calls).toHaveLength(1);
    });
  });

  describe("when options change", () => {
    it("should stop refreshing when refresh gets turned off", async () => {
      const { rerender } = renderRefresh();
      await advance();
      await answerAll();

      rerender({ refresh: false });
      await advance(refreshTime * 3);

      expect(calls).toHaveLength(1);
    });
    it("should start refreshing when refresh gets turned on", async () => {
      const { rerender } = renderRefresh({ refresh: false });
      await advance();
      await answerAll();

      rerender({ refresh: true });
      await advance(refreshTime);

      expect(calls).toHaveLength(2);
    });
    it("should stop refreshing when the hook gets disabled", async () => {
      const { rerender } = renderRefresh();
      await advance();
      await answerAll();

      rerender({ disabled: true });
      await advance(refreshTime * 3);

      expect(calls).toHaveLength(1);
    });
    it("should never refresh the disabled hook", async () => {
      renderRefresh({ disabled: true });

      await advance(refreshTime * 3);

      expect(calls).toHaveLength(0);
    });
    it("should use the new refresh time", async () => {
      const { rerender } = renderRefresh();
      await advance();
      await answerAll();

      rerender({ refreshTime: 1000 });
      await advance(1000);

      expect(calls).toHaveLength(2);
    });
    it("should restart the countdown when dependencies change", async () => {
      const { rerender } = renderRefresh({ dependencies: [1] });
      await advance();
      await answerAll();

      await advance(refreshTime - 1000);
      rerender({ dependencies: [2] });
      await advance();
      await answerAll();
      expect(calls).toHaveLength(2);

      // The old countdown would fire here
      await advance(1000);
      expect(calls).toHaveLength(2);

      await advance(refreshTime - 1000);
      expect(calls).toHaveLength(3);
    });
  });

  describe("when refetch is called during the countdown", () => {
    it("should restart the countdown", async () => {
      const { result } = renderRefresh();
      await advance();
      await answerAll();

      await advance(refreshTime - 1000);
      act(() => {
        result.current.refetch();
      });
      await advance();
      await answerAll();
      expect(calls).toHaveLength(2);

      await advance(refreshTime - 1000);
      expect(calls).toHaveLength(2);

      await advance(1000);
      expect(calls).toHaveLength(3);
    });
  });

  describe("when the window is blurred", () => {
    it("should keep refreshing by default", async () => {
      renderRefresh();
      await advance();
      await answerAll();

      act(() => {
        client.appManager.setFocused(false);
      });
      await advance(refreshTime);

      expect(calls).toHaveLength(2);
    });
    it("should not refresh when refetchBlurred is off", async () => {
      renderRefresh({ refetchBlurred: false });
      await advance();
      await answerAll();

      act(() => {
        client.appManager.setFocused(false);
      });
      await advance(refreshTime * 3);

      expect(calls).toHaveLength(1);
    });
    it("should refresh again after the window gets focused", async () => {
      renderRefresh({ refetchBlurred: false });
      await advance();
      await answerAll();

      act(() => {
        client.appManager.setFocused(false);
      });
      await advance(refreshTime * 2);
      act(() => {
        client.appManager.setFocused(true);
      });
      await advance(refreshTime);

      expect(calls).toHaveLength(2);
    });
    it("should respect refetchBlurred changed after the countdown started", async () => {
      const { rerender } = renderRefresh({ refetchBlurred: true });
      await advance();
      await answerAll();

      act(() => {
        client.appManager.setFocused(false);
      });
      rerender({ refetchBlurred: false });
      await advance(refreshTime * 2);

      expect(calls).toHaveLength(1);
    });
  });

  describe("when the application is offline", () => {
    it("should queue a single request and send it once online", async () => {
      renderRefresh();
      await advance();
      await answerAll();

      act(() => {
        client.appManager.setOnline(false);
      });
      await advance(refreshTime * 3);
      expect(calls).toHaveLength(1);

      act(() => {
        client.appManager.setOnline(true);
      });
      await advance();

      expect(calls).toHaveLength(2);
    });
  });

  describe("when the hook unmounts", () => {
    it("should stop refreshing", async () => {
      const { unmount } = renderRefresh();
      await advance();
      await answerAll();

      unmount();
      await advance(refreshTime * 3);

      expect(calls).toHaveLength(1);
    });
    it("should remove the refresh timer", async () => {
      const { unmount } = renderRefresh({ refresh: false });
      await advance();
      await answerAll();
      const baseline = vi.getTimerCount();
      unmount();

      const { unmount: unmountRefreshing } = renderRefresh();
      await advance();
      await answerAll();
      expect(vi.getTimerCount()).toBeGreaterThan(baseline);
      unmountRefreshing();

      expect(vi.getTimerCount()).toBe(baseline);
    });
    it("should stop refreshing after unmounting in StrictMode", async () => {
      const { unmount } = renderRefresh({}, StrictMode);
      await advance();
      await answerAll();

      unmount();
      await advance(refreshTime * 3);

      expect(calls).toHaveLength(1);
    });
  });

  describe("when the request key changes", () => {
    it("should refresh only the current key", async () => {
      const { rerender } = renderHook(
        ({ page }) => useFetch(request.setQueryParams({ page }), { refresh: true, refreshTime }).data,
        { initialProps: { page: 1 } },
      );
      await advance();
      await answerAll();

      await advance(refreshTime - 1000);
      rerender({ page: 2 });
      await advance();
      await answerAll();

      await advance(refreshTime);

      expect(calls.map((call) => call.request.queryParams)).toStrictEqual([{ page: 1 }, { page: 2 }, { page: 2 }]);
    });
  });
});
