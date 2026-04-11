/// <reference types="vitest/globals" />
import { Suspense, StrictMode, Component, useState, ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { useFetch } from "hooks/use-fetch";
import { client, createRequest } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function DataView({ request, testId = "result" }: { request: any; testId?: string }) {
  const { data, error, loading, status } = useFetch(request, {
    suspense: true,
    dependencyTracking: false,
  });

  return (
    <div data-testid={testId} data-loading={loading} data-status={status}>
      {error ? `error:${JSON.stringify(error)}` : `data:${JSON.stringify(data)}`}
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;
    if (error) {
      return fallback ?? <div data-testid="error-boundary">{error.message}</div>;
    }
    return children;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useFetch [ Suspense ]", () => {
  let request = createRequest();

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
    request = createRequest();
    client.clear();
  });

  // -----------------------------------------------------------------------
  // Fallback rendering
  // -----------------------------------------------------------------------

  describe("when rendering with a Suspense boundary", () => {
    it("should show fallback while loading and render data once resolved", async () => {
      const mock = mockRequest(request);

      render(
        <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
          <DataView request={request} />
        </Suspense>,
      );

      expect(screen.getByTestId("fallback")).toBeInTheDocument();

      await waitFor(() => {
        const el = screen.getByTestId("result");
        expect(el.textContent).toContain(JSON.stringify(mock));
        expect(el).toHaveAttribute("data-loading", "false");
      });
    });

    it("should render error response without crashing", async () => {
      mockRequest(request, { status: 400 });

      render(
        <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
          <DataView request={request} />
        </Suspense>,
      );

      expect(screen.getByTestId("fallback")).toBeInTheDocument();

      await waitFor(() => {
        const el = screen.getByTestId("result");
        expect(el.textContent).toContain("error:");
      });
    });

    it("should set correct status code on success", async () => {
      mockRequest(request);

      render(
        <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
          <DataView request={request} />
        </Suspense>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("result")).toHaveAttribute("data-status", "200");
      });
    });

    it("should set correct status code on error", async () => {
      mockRequest(request, { status: 500 });

      render(
        <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
          <DataView request={request} />
        </Suspense>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("result")).toHaveAttribute("data-status", "500");
      });
    });
  });

  // -----------------------------------------------------------------------
  // Cached data
  // -----------------------------------------------------------------------

  describe("when cache already has data", () => {
    it("should render immediately without suspending", async () => {
      const mock = mockRequest(request);

      function CachedView({ testId }: { testId: string }) {
        const { data, loading } = useFetch(request, {
          suspense: true,
          revalidate: false,
          dependencyTracking: false,
        });
        return (
          <div data-testid={testId}>
            data:{JSON.stringify(data)},loading:{String(loading)}
          </div>
        );
      }

      // First render — suspends, then resolves
      const first = render(
        <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
          <CachedView testId="first" />
        </Suspense>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("first").textContent).toContain(JSON.stringify(mock));
      });

      first.unmount();

      // Second render — should NOT suspend since data is cached
      render(
        <Suspense fallback={<div data-testid="fallback2">Loading...</div>}>
          <CachedView testId="second" />
        </Suspense>,
      );

      // Synchronous assertion — no fallback, data rendered immediately
      expect(screen.getByTestId("second").textContent).toContain(JSON.stringify(mock));
    });
  });

  // -----------------------------------------------------------------------
  // Disabled
  // -----------------------------------------------------------------------

  describe("when disabled", () => {
    it("should not suspend and render with null data", () => {
      function DisabledView() {
        const { data, loading } = useFetch(request, {
          suspense: true,
          disabled: true,
          dependencyTracking: false,
        });
        return (
          <div data-testid="disabled">
            data:{String(data)},loading:{String(loading)}
          </div>
        );
      }

      render(
        <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
          <DisabledView />
        </Suspense>,
      );

      expect(screen.getByTestId("disabled").textContent).toContain("data:null");
      expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Multiple components
  // -----------------------------------------------------------------------

  describe("when multiple components suspend under the same boundary", () => {
    it("should show single fallback until all resolve", async () => {
      const requestA = createRequest({ endpoint: "/suspense-a" });
      const requestB = createRequest({ endpoint: "/suspense-b" });

      const mockA = mockRequest(requestA);
      const mockB = mockRequest(requestB, { delay: 50 });

      render(
        <Suspense fallback={<div data-testid="fallback">Loading all...</div>}>
          <DataView request={requestA} testId="a" />
          <DataView request={requestB} testId="b" />
        </Suspense>,
      );

      expect(screen.getByTestId("fallback")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("a").textContent).toContain(JSON.stringify(mockA));
        expect(screen.getByTestId("b").textContent).toContain(JSON.stringify(mockB));
      });
    });

    it("should support independent Suspense boundaries per component", async () => {
      const requestA = createRequest({ endpoint: "/suspense-ind-a" });
      const requestB = createRequest({ endpoint: "/suspense-ind-b" });

      const mockA = mockRequest(requestA);
      mockRequest(requestB, { delay: 100 });

      render(
        <div>
          <Suspense fallback={<div data-testid="fallback-a">Loading A...</div>}>
            <DataView request={requestA} testId="a" />
          </Suspense>
          <Suspense fallback={<div data-testid="fallback-b">Loading B...</div>}>
            <DataView request={requestB} testId="b" />
          </Suspense>
        </div>,
      );

      // Both should initially show fallbacks
      expect(screen.getByTestId("fallback-a")).toBeInTheDocument();
      expect(screen.getByTestId("fallback-b")).toBeInTheDocument();

      // A resolves first (no delay)
      await waitFor(() => {
        expect(screen.getByTestId("a").textContent).toContain(JSON.stringify(mockA));
      });
    });
  });

  // -----------------------------------------------------------------------
  // Nested Suspense boundaries
  // -----------------------------------------------------------------------

  describe("when using nested Suspense boundaries", () => {
    it("should allow outer fallback to wrap inner components", async () => {
      const outerRequest = createRequest({ endpoint: "/nested-outer" });
      const innerRequest = createRequest({ endpoint: "/nested-inner" });

      const outerMock = mockRequest(outerRequest);
      const innerMock = mockRequest(innerRequest, { delay: 50 });

      function InnerView() {
        const { data } = useFetch(innerRequest, { suspense: true, dependencyTracking: false });
        return <div data-testid="inner">inner:{JSON.stringify(data)}</div>;
      }

      function OuterView() {
        const { data } = useFetch(outerRequest, { suspense: true, dependencyTracking: false });
        return (
          <div data-testid="outer">
            outer:{JSON.stringify(data)}
            <Suspense fallback={<div data-testid="inner-fallback">Inner loading...</div>}>
              <InnerView />
            </Suspense>
          </div>
        );
      }

      render(
        <Suspense fallback={<div data-testid="outer-fallback">Outer loading...</div>}>
          <OuterView />
        </Suspense>,
      );

      expect(screen.getByTestId("outer-fallback")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("outer").textContent).toContain(JSON.stringify(outerMock));
      });

      await waitFor(() => {
        expect(screen.getByTestId("inner").textContent).toContain(JSON.stringify(innerMock));
      });
    });
  });

  // -----------------------------------------------------------------------
  // StrictMode compatibility
  // -----------------------------------------------------------------------

  describe("when rendering in StrictMode", () => {
    it("should work correctly with StrictMode double-render", async () => {
      const mock = mockRequest(request);

      render(
        <StrictMode>
          <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
            <DataView request={request} />
          </Suspense>
        </StrictMode>,
      );

      await waitFor(() => {
        const el = screen.getByTestId("result");
        expect(el.textContent).toContain(JSON.stringify(mock));
      });
    });
  });

  // -----------------------------------------------------------------------
  // Dynamic parameter changes
  // -----------------------------------------------------------------------

  describe("when request parameters change", () => {
    it("should re-suspend when cache key changes", async () => {
      const request1 = createRequest({ endpoint: "/suspense-param-1" });
      const request2 = createRequest({ endpoint: "/suspense-param-2" });

      const mock1 = mockRequest(request1);
      const mock2 = mockRequest(request2, { delay: 50 });

      function ParamView({ req }: { req: any }) {
        const { data } = useFetch(req, { suspense: true, dependencyTracking: false });
        return <div data-testid="param-result">{JSON.stringify(data)}</div>;
      }

      function Wrapper() {
        const [req, setReq] = useState<typeof request1 | typeof request2>(request1);
        return (
          <>
            <button type="button" data-testid="switch-btn" onClick={() => setReq(request2)}>
              Switch
            </button>
            <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
              <ParamView req={req} />
            </Suspense>
          </>
        );
      }

      render(<Wrapper />);

      await waitFor(() => {
        expect(screen.getByTestId("param-result").textContent).toContain(JSON.stringify(mock1));
      });

      act(() => {
        fireEvent.click(screen.getByTestId("switch-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("param-result").textContent).toContain(JSON.stringify(mock2));
      });
    });
  });

  // -----------------------------------------------------------------------
  // ErrorBoundary integration
  // -----------------------------------------------------------------------

  describe("when combined with ErrorBoundary", () => {
    it("should not trigger ErrorBoundary on normal error responses", async () => {
      mockRequest(request, { status: 400 });

      render(
        <ErrorBoundary fallback={<div data-testid="error-boundary">Caught!</div>}>
          <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
            <DataView request={request} />
          </Suspense>
        </ErrorBoundary>,
      );

      await waitFor(() => {
        const el = screen.getByTestId("result");
        expect(el.textContent).toContain("error:");
      });

      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Refetch after suspense
  // -----------------------------------------------------------------------

  describe("when refetching after initial suspense", () => {
    it("should not re-suspend on refetch (data is already present)", async () => {
      const mock = mockRequest(request);
      const spy = vi.fn();

      function RefetchView() {
        const { data, refetch } = useFetch(request, {
          suspense: true,
          dependencyTracking: false,
        });
        spy(data);
        return (
          <div>
            <div data-testid="refetch-data">{JSON.stringify(data)}</div>
            <button type="button" data-testid="refetch-btn" onClick={refetch}>
              Refetch
            </button>
          </div>
        );
      }

      render(
        <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
          <RefetchView />
        </Suspense>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("refetch-data").textContent).toContain(JSON.stringify(mock));
      });

      const newMock = mockRequest(request, { data: { updated: true } });

      act(() => {
        fireEvent.click(screen.getByTestId("refetch-btn"));
      });

      // Should NOT show fallback during refetch
      expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("refetch-data").textContent).toContain(JSON.stringify(newMock));
      });
    });
  });

  // -----------------------------------------------------------------------
  // Non-suspense mode (default)
  // -----------------------------------------------------------------------

  describe("when suspense option is not set", () => {
    it("should behave normally without suspending", async () => {
      const mock = mockRequest(request);

      function NormalView() {
        const { data, loading } = useFetch(request, { dependencyTracking: false });
        if (loading) return <div data-testid="normal-loading">Loading...</div>;
        return <div data-testid="normal-data">{JSON.stringify(data)}</div>;
      }

      render(
        <Suspense fallback={<div data-testid="fallback">Suspense fallback</div>}>
          <NormalView />
        </Suspense>,
      );

      // Should show component's own loading state, not Suspense fallback
      expect(screen.getByTestId("normal-loading")).toBeInTheDocument();
      expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("normal-data").textContent).toContain(JSON.stringify(mock));
      });
    });
  });
});
