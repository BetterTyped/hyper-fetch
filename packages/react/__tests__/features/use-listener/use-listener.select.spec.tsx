import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useListener } from "hooks/use-listener";
import type { ReactNode } from "react";
import { Component, useEffect } from "react";

import { createListener } from "../../utils/listener.utils";

type Prices = Record<string, { price: number }>;

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;
    return error ? <div data-testid="error-boundary">{error.message}</div> : children;
  }
}

describe("useListener [ Select ]", () => {
  const { startServer, stopServer, emitListenerEvent } = createWebsocketMockingServer();
  let listener = createListener<Prices>();

  beforeEach(async () => {
    startServer();
    listener = createListener<Prices>();
    await waitForConnection(listener.socket);
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    stopServer();
  });

  const emit = async (message: Prices, onEvent: ReturnType<typeof vi.fn>, count: number) => {
    act(() => {
      emitListenerEvent(listener, message);
    });
    // Wait for the message delivery instead of rendering, which may not happen on purpose
    await waitFor(() => {
      expect(onEvent).toHaveBeenCalledTimes(count);
    });
  };

  it("should select the message data and rerender only when it changes", async () => {
    const onEvent = vi.fn();
    let renders = 0;

    function Page() {
      const view = useListener(listener, { select: (value) => value.btc.price });
      view.onEvent(onEvent);
      renders += 1;
      return <div data-testid="result">{JSON.stringify(view.data)}</div>;
    }

    render(<Page />);
    const initialRenders = renders;

    await emit({ btc: { price: 1 }, eth: { price: 1 } }, onEvent, 1);
    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe("1");
    });
    const rendersAfterFirst = renders;
    expect(rendersAfterFirst).toBe(initialRenders + 1);

    await emit({ btc: { price: 1 }, eth: { price: 2 } }, onEvent, 2);
    await emit({ btc: { price: 1 }, eth: { price: 3 } }, onEvent, 3);
    expect(renders).toBe(rendersAfterFirst);

    await emit({ btc: { price: 4 }, eth: { price: 3 } }, onEvent, 4);
    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe("4");
    });
    expect(onEvent.mock.lastCall?.[0].data).toStrictEqual({ btc: { price: 4 }, eth: { price: 3 } });
  });

  it("should keep the reference of deeply equal selected objects", async () => {
    const onEvent = vi.fn();
    const effectSpy = vi.fn();

    function Page() {
      const view = useListener(listener, { select: (value) => ({ btc: value.btc }) });
      view.onEvent(onEvent);
      useEffect(() => {
        effectSpy(view.data);
      }, [view.data]);
      return <div data-testid="result">{JSON.stringify(view.data)}</div>;
    }

    render(<Page />);

    await emit({ btc: { price: 1 }, eth: { price: 1 } }, onEvent, 1);
    await emit({ btc: { price: 1 }, eth: { price: 2 } }, onEvent, 2);

    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe(JSON.stringify({ btc: { price: 1 } }));
    });
    // initial null and first message only
    expect(effectSpy).toHaveBeenCalledTimes(2);
  });

  it("should update data on every message without a selector", async () => {
    const onEvent = vi.fn();
    const effectSpy = vi.fn();

    function Page() {
      const view = useListener(listener);
      view.onEvent(onEvent);
      useEffect(() => {
        effectSpy(view.data);
      }, [view.data]);
      return <div data-testid="result">{JSON.stringify(view.data)}</div>;
    }

    render(<Page />);

    await emit({ btc: { price: 1 } }, onEvent, 1);
    await emit({ btc: { price: 1 } }, onEvent, 2);

    await waitFor(() => {
      expect(effectSpy).toHaveBeenCalledTimes(3);
    });
  });

  it("should re-run the selector when it changes between renders", async () => {
    const onEvent = vi.fn();

    function Page({ id }: { id: string }) {
      const view = useListener(listener, { select: (value) => value[id].price });
      view.onEvent(onEvent);
      return <div data-testid="result">{JSON.stringify(view.data)}</div>;
    }

    const view = render(<Page id="btc" />);
    await emit({ btc: { price: 1 }, eth: { price: 2 } }, onEvent, 1);
    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe("1");
    });

    view.rerender(<Page id="eth" />);

    expect(screen.getByTestId("result").textContent).toBe("2");
  });

  it("should pass the selector error to the error boundary", async () => {
    vi.spyOn(console, "error").mockImplementation(() => null);
    const onEvent = vi.fn();

    function Page() {
      const view = useListener(listener, {
        select: (value) => {
          if (!value.btc) {
            throw new Error("Missing btc");
          }
          return value.btc.price;
        },
      });
      view.onEvent(onEvent);
      return <div data-testid="result">{JSON.stringify(view.data)}</div>;
    }

    render(
      <ErrorBoundary>
        <Page />
      </ErrorBoundary>,
    );

    await emit({ eth: { price: 1 } }, onEvent, 1);

    await waitFor(() => {
      expect(screen.getByTestId("error-boundary").textContent).toBe("Missing btc");
    });
  });
});
