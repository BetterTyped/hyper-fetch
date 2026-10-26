import type { ExtractResponseType, RequestInstance } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import type { ReactNode } from "react";
import { Component, Suspense, useEffect } from "react";

import { client, createRequest } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

type Symbols = Record<string, { price: number; name: string }>;

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
    if (error) {
      return <div data-testid="error-boundary">{error.message}</div>;
    }
    return children;
  }
}

describe("useFetch [ Select ]", () => {
  const symbols: Symbols = {
    btc: { price: 1, name: "Bitcoin" },
    eth: { price: 2, name: "Ethereum" },
  };

  let request = createRequest<Symbols>();

  const setCacheData = (req: RequestInstance, data: ExtractResponseType<typeof request>) => {
    act(() => {
      client.cache.set(req, {
        data,
        error: null,
        status: 200,
        success: true,
        extra: {},
        retries: 0,
        isCanceled: false,
        isOffline: false,
        willRetry: false,
        addedTimestamp: Date.now(),
        triggerTimestamp: Date.now(),
        requestTimestamp: Date.now(),
        responseTimestamp: Date.now(),
      });
    });
  };

  const waitForData = async (testId = "result") => {
    await waitFor(() => {
      expect(screen.getByTestId(testId).textContent).not.toBe("null");
    });
  };

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    vi.resetModules();
    client.clear();
    request = createRequest<Symbols>();
  });

  describe("when selecting part of the response", () => {
    it("should return the selected data", async () => {
      mockRequest(request, { data: symbols });

      function Page() {
        const { data } = useFetch(request, { select: (value) => value.btc });
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      render(<Page />);

      await waitFor(() => {
        expect(screen.getByTestId("result").textContent).toBe(JSON.stringify(symbols.btc));
      });
    });

    it("should share one request between hooks selecting different parts", async () => {
      mockRequest(request, { data: symbols });
      const responseSpy = vi.fn();
      const unmount = client.requestManager.events.onResponse(responseSpy);

      function Price({ id }: { id: string }) {
        const { data } = useFetch(request, { select: (value) => value[id].price });
        return <div data-testid={id}>{JSON.stringify(data)}</div>;
      }

      render(
        <>
          <Price id="btc" />
          <Price id="eth" />
        </>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("btc").textContent).toBe("1");
        expect(screen.getByTestId("eth").textContent).toBe("2");
      });
      expect(responseSpy).toHaveBeenCalledTimes(1);
      unmount();
    });

    it("should not rerender when the unselected part of the data changes", async () => {
      mockRequest(request, { data: symbols });
      let renders = 0;

      function Page() {
        const { data } = useFetch(request, { select: (value) => value.btc });
        renders += 1;
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      render(<Page />);
      await waitForData();
      const rendersAfterLoad = renders;

      setCacheData(request, { ...symbols, eth: { price: 999, name: "Ethereum" } });
      setCacheData(request, { ...symbols, eth: { price: 1000, name: "Ethereum" } });

      expect(renders).toBe(rendersAfterLoad);

      setCacheData(request, { ...symbols, btc: { price: 5, name: "Bitcoin" } });

      expect(renders).toBe(rendersAfterLoad + 1);
      expect(screen.getByTestId("result").textContent).toBe(JSON.stringify({ price: 5, name: "Bitcoin" }));
    });

    it("should keep the reference of a recreated selected object when it is deeply equal", async () => {
      mockRequest(request, { data: symbols });
      const references = new Set<unknown>();
      const effectSpy = vi.fn();

      function Page() {
        // Inline selector creating a new object on every call
        const { data, loading } = useFetch(request, { select: (value) => ({ price: value.btc.price }) });
        if (data) {
          references.add(data);
        }
        useEffect(() => {
          effectSpy();
        }, [data]);
        return <div data-testid="result">{loading ? "loading" : JSON.stringify(data)}</div>;
      }

      render(<Page />);
      await waitFor(() => {
        expect(screen.getByTestId("result").textContent).toBe(JSON.stringify({ price: 1 }));
      });
      const effectsAfterLoad = effectSpy.mock.calls.length;

      setCacheData(request, { ...symbols, eth: { price: 3, name: "Ethereum" } });
      setCacheData(request, { btc: { price: 1, name: "Renamed" }, eth: { price: 3, name: "Ethereum" } });

      expect(references.size).toBe(1);
      expect(effectSpy).toHaveBeenCalledTimes(effectsAfterLoad);
    });

    it("should re-run the selector when it changes between renders", async () => {
      mockRequest(request, { data: symbols });

      function Page({ id }: { id: string }) {
        const { data } = useFetch(request, { select: (value) => value[id].name });
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      const view = render(<Page id="btc" />);
      await waitFor(() => {
        expect(screen.getByTestId("result").textContent).toBe(JSON.stringify("Bitcoin"));
      });

      view.rerender(<Page id="eth" />);

      // Same render - without waiting for any new data
      expect(screen.getByTestId("result").textContent).toBe(JSON.stringify("Ethereum"));
    });

    it("should apply the selector to the cached data on mount", async () => {
      setCacheData(request, symbols);

      function Page() {
        const { data } = useFetch(request, { select: (value) => value.eth.price, revalidate: false });
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      render(<Page />);

      expect(screen.getByTestId("result").textContent).toBe("2");
    });

    it("should apply the selector to the initial response", async () => {
      mockRequest(request, { data: symbols, delay: 50 });

      function Page() {
        const { data } = useFetch(request, {
          select: (value) => value.btc.name,
          initialResponse: { data: { btc: { price: 0, name: "Initial" } } },
        });
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      render(<Page />);

      expect(screen.getByTestId("result").textContent).toBe(JSON.stringify("Initial"));
      await waitFor(() => {
        expect(screen.getByTestId("result").textContent).toBe(JSON.stringify("Bitcoin"));
      });
    });

    it("should keep the data set locally with setData while selector is recreated on every render", async () => {
      mockRequest(request, { data: symbols });
      let setData: ((value: number) => void) | null = null;

      function Page() {
        const view = useFetch(request, { select: (value) => value.btc.price });
        setData = view.setData;
        return <div data-testid="result">{JSON.stringify(view.data)}</div>;
      }

      render(<Page />);
      await waitFor(() => {
        expect(screen.getByTestId("result").textContent).toBe("1");
      });

      act(() => {
        setData?.(42);
      });

      expect(screen.getByTestId("result").textContent).toBe("42");

      // Next response replaces the local data
      setCacheData(request, { ...symbols, btc: { price: 7, name: "Bitcoin" } });
      expect(screen.getByTestId("result").textContent).toBe("7");
    });

    it("should not call the selector for empty data", async () => {
      mockRequest(request, { status: 400, delay: 10 });
      const selectSpy = vi.fn((value: Symbols) => value.btc);

      function Page() {
        const { data, error } = useFetch(request, { select: selectSpy });
        return <div data-testid="result">{error ? "error" : JSON.stringify(data)}</div>;
      }

      render(<Page />);

      await waitFor(() => {
        expect(screen.getByTestId("result").textContent).toBe("error");
      });
      expect(selectSpy).not.toHaveBeenCalled();
    });

    it("should pass the selector error to the error boundary", async () => {
      mockRequest(request, { data: symbols });
      vi.spyOn(console, "error").mockImplementation(() => null);

      function Page() {
        const { data } = useFetch(request, {
          select: (value) => {
            if (value.btc.price > 1) {
              throw new Error("Selector failed");
            }
            return value.btc;
          },
        });
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      render(
        <ErrorBoundary>
          <Page />
        </ErrorBoundary>,
      );
      await waitForData();

      setCacheData(request, { ...symbols, btc: { price: 2, name: "Bitcoin" } });

      await waitFor(() => {
        expect(screen.getByTestId("error-boundary").textContent).toBe("Selector failed");
      });
    });

    it("should apply the selector in suspense mode", async () => {
      mockRequest(request, { data: symbols });

      function Page() {
        const { data } = useFetch(request, { suspense: true, select: (value) => value.eth.name });
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      render(
        <Suspense fallback={<div data-testid="fallback" />}>
          <Page />
        </Suspense>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("result").textContent).toBe(JSON.stringify("Ethereum"));
      });
    });
  });

  describe("when using structural sharing", () => {
    it("should keep the data reference when the same data is received again", async () => {
      mockRequest(request, { data: symbols });
      const effectSpy = vi.fn();
      let refetch: (() => void) | null = null;

      function Page() {
        const view = useFetch(request);
        refetch = view.refetch;
        useEffect(() => {
          effectSpy(view.data);
        }, [view.data]);
        return <div data-testid="result">{view.loading ? "loading" : JSON.stringify(view.data)}</div>;
      }

      render(<Page />);
      await waitFor(() => {
        expect(screen.getByTestId("result").textContent).toBe(JSON.stringify(symbols));
      });
      const firstData = effectSpy.mock.lastCall?.[0];

      act(() => {
        refetch?.();
      });
      await waitFor(() => {
        expect(screen.getByTestId("result").textContent).toBe(JSON.stringify(symbols));
      });

      expect(effectSpy.mock.lastCall?.[0]).toBe(firstData);
      // null -> data, never a second time for the equal response
      expect(effectSpy.mock.calls.filter(([value]) => value !== null)).toHaveLength(1);
    });

    it("should reuse unchanged parts of the data", async () => {
      setCacheData(request, symbols);
      let current: Symbols | null = null;

      function Page() {
        const { data } = useFetch(request, { revalidate: false });
        current = data;
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      render(<Page />);
      const first = current as unknown as Symbols;

      setCacheData(request, { btc: { price: 1, name: "Bitcoin" }, eth: { price: 5, name: "Ethereum" } });
      const second = current as unknown as Symbols;

      expect(second).not.toBe(first);
      expect(second.btc).toBe(first.btc);
      expect(second.eth).toStrictEqual({ price: 5, name: "Ethereum" });
    });

    it("should allow to disable structural sharing of the selected data", async () => {
      setCacheData(request, symbols);
      let current: unknown = null;

      function Page() {
        const { data } = useFetch(request, {
          revalidate: false,
          structuralSharing: false,
          deepCompare: false,
          select: (value) => ({ price: value.btc.price }),
        });
        current = data;
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      render(<Page />);
      const first = current;
      setCacheData(request, { ...symbols, eth: { price: 3, name: "Ethereum" } });

      expect(current).not.toBe(first);
      expect(current).toStrictEqual(first);
    });

    it("should give new references when sharing is disabled everywhere", async () => {
      const unsharedRequest = request.setStructuralSharing(false);
      setCacheData(unsharedRequest, symbols);
      const references = new Set<unknown>();

      function Page() {
        const { data } = useFetch(unsharedRequest, { revalidate: false, deepCompare: false });
        references.add(data);
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      render(<Page />);
      setCacheData(unsharedRequest, { ...symbols });

      expect(references.size).toBe(2);
    });
  });
});
