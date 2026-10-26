import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import type { ReactNode } from "react";
import { Component, Suspense } from "react";

import { client, createRequest } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  handleReset = () => {
    // eslint-disable-next-line react/no-set-state
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children } = this.props;
    if (error) {
      return (
        <button type="button" data-testid="error-boundary" onClick={this.handleReset}>
          {JSON.stringify(error)}
        </button>
      );
    }
    return children;
  }
}

describe("useFetch [ Throw On Error ]", () => {
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
    vi.restoreAllMocks();
    // React logs the errors caught by boundaries
    vi.spyOn(console, "error").mockImplementation(() => null);
    client.clear();
    request = createRequest();
  });

  function Page({ throwOnError }: { throwOnError: boolean | ((error: any) => boolean) }) {
    // Component does not read the error - the hook still has to throw it
    const { data, loading } = useFetch(request, { throwOnError });
    return <div data-testid="result">{loading ? "loading" : JSON.stringify(data)}</div>;
  }

  it("should throw the error to the error boundary", async () => {
    const error = mockRequest(request, { status: 400 });

    render(
      <ErrorBoundary>
        <Page throwOnError />
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-boundary").textContent).toBe(JSON.stringify(error));
    });
  });

  it("should not throw when the request succeeds", async () => {
    const data = mockRequest(request, { data: { value: 1 } });

    render(
      <ErrorBoundary>
        <Page throwOnError />
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe(JSON.stringify(data));
    });
    expect(screen.queryByTestId("error-boundary")).toBeNull();
  });

  it("should keep the error in the state when disabled", async () => {
    mockRequest(request, { status: 400 });

    function ErrorPage() {
      const { error, loading } = useFetch(request);
      const status = error ? "error" : "none";
      return <div data-testid="result">{loading ? "loading" : status}</div>;
    }

    render(
      <ErrorBoundary>
        <ErrorPage />
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe("error");
    });
    expect(screen.queryByTestId("error-boundary")).toBeNull();
  });

  it("should decide with the predicate", async () => {
    mockRequest(request, { status: 400 });
    const predicate = vi.fn(() => false);

    render(
      <ErrorBoundary>
        <Page throwOnError={predicate} />
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(predicate).toHaveBeenCalled();
    });
    expect(screen.queryByTestId("error-boundary")).toBeNull();
    expect(predicate.mock.calls[0]).toHaveLength(1);
  });

  it("should throw when the predicate allows it", async () => {
    mockRequest(request, { status: 400 });

    render(
      <ErrorBoundary>
        <Page throwOnError={(error) => !!error} />
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });
  });

  it("should throw only after the retries are finished", async () => {
    request = createRequest().setRetry(2).setRetryTime(10);
    mockRequest(request, { status: 500 });
    const responseSpy = vi.fn();
    const unmount = client.requestManager.events.onResponse(responseSpy);

    render(
      <ErrorBoundary>
        <Page throwOnError />
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });
    expect(responseSpy).toHaveBeenCalledTimes(3);
    unmount();
  });

  it("should fetch again after the error boundary reset", async () => {
    mockRequest(request, { status: 400 });

    render(
      <ErrorBoundary>
        <Page throwOnError />
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });

    const data = mockRequest(request, { data: { recovered: true } });
    act(() => {
      screen.getByTestId("error-boundary").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe(JSON.stringify(data));
    });
  });

  it("should throw in suspense mode", async () => {
    const error = mockRequest(request, { status: 400 });

    function SuspensePage() {
      const { data } = useFetch(request, { suspense: true, throwOnError: true });
      return <div data-testid="result">{JSON.stringify(data)}</div>;
    }

    render(
      <ErrorBoundary>
        <Suspense fallback={<div data-testid="fallback" />}>
          <SuspensePage />
        </Suspense>
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-boundary").textContent).toBe(JSON.stringify(error));
    });
  });
});
