import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";

import { Countdown } from "@/components/countdown/countdown";
import { useClipboard } from "@/hooks/use-clipboard";
import { useInterval } from "@/hooks/use-interval";
import { useIsFocused } from "@/hooks/use-is-focused";

describe("useInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should call back once per interval and stop when unmounted", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 100), { wrapper: StrictMode });

    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(3);

    unmount();
    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("should call the latest callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ callback }) => useInterval(callback, 100), { initialProps: { callback: first } });

    rerender({ callback: second });
    vi.advanceTimersByTime(100);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("should restart with a new interval", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(({ interval }) => useInterval(callback, interval), {
      initialProps: { interval: 100 },
    });

    rerender({ interval: 1000 });
    vi.advanceTimersByTime(999);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(callback).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);
  });
});

describe("useIsFocused", () => {
  it("should follow the window focus until unmounted", () => {
    const { result, unmount } = renderHook(() => useIsFocused());
    expect(result.current).toBeTrue();

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });
    expect(result.current).toBeFalse();

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(result.current).toBeTrue();

    const removeListener = vi.spyOn(window, "removeEventListener");
    unmount();
    expect(removeListener).toHaveBeenCalledWith("focus", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith("blur", expect.any(Function));
  });
});

describe("useClipboard", () => {
  beforeEach(() => {
    userEvent.setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should write the text and report success", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useClipboard({ onSuccess }));

    result.current.copy("hello");

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith("hello"));
    expect(await navigator.clipboard.readText()).toBe("hello");
  });

  it("should report a refused write instead of rejecting", async () => {
    const error = new Error("Write permission denied");
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(error);
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useClipboard({ onSuccess, onError }));

    result.current.copy("hello");

    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error, "hello"));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("should work without callbacks", async () => {
    const { result } = renderHook(() => useClipboard());

    result.current.copy("quiet");

    await vi.waitFor(async () => expect(await navigator.clipboard.readText()).toBe("quiet"));
  });
});

describe("Countdown", () => {
  const start = new Date("2026-01-01T10:00:00.000Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(start);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const tick = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };

  it("should count down the time left in words", () => {
    const { container } = render(<Countdown value={start + 2 * 60 * 60 * 1000 + 61_000} />);
    expect(container).toHaveTextContent("2 hours 1 minute 1 second");

    tick(1000);
    expect(container).toHaveTextContent("2 hours 1 minute");
    expect(container).not.toHaveTextContent("second");

    tick(59_000);
    expect(container).toHaveTextContent("2 hours 1 second");
  });

  it("should count days", () => {
    const { container } = render(<Countdown value={start + 24 * 60 * 60 * 1000 + 2000} />);

    expect(container).toHaveTextContent("1 day 2 seconds");
  });

  it("should start for a future time and finish when it passes", () => {
    const onStart = vi.fn();
    const onDone = vi.fn();
    render(<Countdown value={start + 2000} onStart={onStart} onDone={onDone} doneText="Stale" />);
    expect(onStart).toHaveBeenCalledOnce();
    expect(onDone).not.toHaveBeenCalled();

    tick(2000);
    expect(screen.getByText("Stale")).toBeInTheDocument();

    // It stays done, so it finishes once
    tick(5000);
    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("should count again when a past time is replaced by a future one", () => {
    // e.g. stale cache data that the application refetched
    const onStart = vi.fn();
    const onDone = vi.fn();
    const { rerender, container } = render(
      <Countdown value={start - 5000} onStart={onStart} onDone={onDone} doneText="Stale" />,
    );
    expect(container).toHaveTextContent("Stale");

    rerender(<Countdown value={start + 10_000} onStart={onStart} onDone={onDone} doneText="Stale" />);

    expect(container).toHaveTextContent("10 seconds");
    expect(onStart).toHaveBeenCalledOnce();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("should start again when given a new future time", () => {
    const onStart = vi.fn();
    const onDone = vi.fn();
    const { rerender, container } = render(<Countdown value={start + 1000} onStart={onStart} onDone={onDone} />);
    tick(1000);
    expect(onDone).toHaveBeenCalledOnce();

    rerender(<Countdown value={start + 10_000} onStart={onStart} onDone={onDone} />);
    tick(1000);

    expect(onStart).toHaveBeenCalledTimes(2);
    expect(container).toHaveTextContent("8 seconds");
  });

  it("should show a past time as done without starting", () => {
    const onStart = vi.fn();
    render(<Countdown value={start - 5000} onStart={onStart} />);

    expect(screen.getByText("Past")).toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
  });

  it.each([Infinity, Number.NaN, 0])("should show %s as it is", (value) => {
    const { container } = render(<Countdown value={value} doneText="Past" />);

    expect(container).toHaveTextContent(String(value));
    expect(container).not.toHaveTextContent("Past");
  });

  it("should treat a time that never comes as running", () => {
    // e.g. cache data with an infinite stale time
    const onStart = vi.fn();
    const onDone = vi.fn();
    render(<Countdown value={Infinity} onStart={onStart} onDone={onDone} />);

    tick(5000);

    expect(onStart).toHaveBeenCalledOnce();
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe("Countdown [ Changing values ]", () => {
  const start = new Date("2026-01-01T10:00:00.000Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(start);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should finish when a running time is replaced by a past one", () => {
    // e.g. cache data invalidated while its details are open
    const onStart = vi.fn();
    const onDone = vi.fn();
    const { rerender, container } = render(
      <Countdown value={start + 10_000} onStart={onStart} onDone={onDone} doneText="Stale" />,
    );
    onStart.mockClear();

    rerender(<Countdown value={start - 1000} onStart={onStart} onDone={onDone} doneText="Stale" />);

    expect(container).toHaveTextContent("Stale");
    expect(onDone).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });

  it("should keep counting without starting again when moved to another future time", () => {
    const onStart = vi.fn();
    const { rerender, container } = render(<Countdown value={start + 10_000} onStart={onStart} />);

    rerender(<Countdown value={start + 20_000} onStart={onStart} />);

    expect(container).toHaveTextContent("20 seconds");
    expect(onStart).toHaveBeenCalledOnce();
  });
});
