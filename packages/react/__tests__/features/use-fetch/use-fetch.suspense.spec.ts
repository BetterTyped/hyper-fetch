import React, { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { useFetch } from "hooks/use-fetch";
import { createRequest, client } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

function TestComponent({ request, testId = "result" }: { request: any; testId?: string }) {
  const { data, error, loading } = useFetch(request, { suspense: true, dependencyTracking: false });

  if (error) {
    return React.createElement("div", { "data-testid": testId }, `error:${JSON.stringify(error)}`);
  }
  return React.createElement(
    "div",
    { "data-testid": testId },
    `data:${JSON.stringify(data)},loading:${String(loading)}`,
  );
}

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
    jest.resetModules();
    request = createRequest();
    client.clear();
  });

  it("should show fallback while loading and render data once resolved", async () => {
    const mock = mockRequest(request);

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { "data-testid": "fallback" }, "Loading...") },
        React.createElement(TestComponent, { request }),
      ),
    );

    expect(screen.getByTestId("fallback")).toBeDefined();

    await waitFor(() => {
      const el = screen.getByTestId("result");
      expect(el.textContent).toContain(JSON.stringify(mock));
      expect(el.textContent).toContain("loading:false");
    });
  });

  it("should render error data when request fails", async () => {
    mockRequest(request, { status: 400 });

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { "data-testid": "fallback" }, "Loading...") },
        React.createElement(TestComponent, { request }),
      ),
    );

    expect(screen.getByTestId("fallback")).toBeDefined();

    await waitFor(() => {
      const el = screen.getByTestId("result");
      expect(el.textContent).toContain("error:");
    });
  });

  it("should not suspend when data is already cached", async () => {
    const mock = mockRequest(request);

    function CachedComponent({ testId }: { testId: string }) {
      const { data, loading } = useFetch(request, {
        suspense: true,
        revalidate: false,
        dependencyTracking: false,
      });
      return React.createElement(
        "div",
        { "data-testid": testId },
        `data:${JSON.stringify(data)},loading:${String(loading)}`,
      );
    }

    const firstRender = render(
      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { "data-testid": "fallback" }, "Loading...") },
        React.createElement(CachedComponent, { testId: "first" }),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId("first").textContent).toContain(JSON.stringify(mock));
    });

    firstRender.unmount();

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { "data-testid": "fallback2" }, "Loading...") },
        React.createElement(CachedComponent, { testId: "second" }),
      ),
    );

    expect(screen.getByTestId("second").textContent).toContain(JSON.stringify(mock));
  });

  it("should not suspend when disabled", async () => {
    function DisabledComponent() {
      const { data, loading } = useFetch(request, {
        suspense: true,
        disabled: true,
        dependencyTracking: false,
      });
      return React.createElement(
        "div",
        { "data-testid": "disabled" },
        `data:${String(data)},loading:${String(loading)}`,
      );
    }

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { "data-testid": "fallback" }, "Loading...") },
        React.createElement(DisabledComponent),
      ),
    );

    expect(screen.getByTestId("disabled").textContent).toContain("data:null");
  });

  it("should pass status and extra through suspense result", async () => {
    function StatusComponent({ req, testId = "status-result" }: { req: any; testId?: string }) {
      const { data, status, extra } = useFetch(req, { suspense: true, dependencyTracking: false });
      return React.createElement(
        "div",
        { "data-testid": testId },
        `data:${JSON.stringify(data)},status:${status},extra:${JSON.stringify(extra)}`,
      );
    }

    const mock = mockRequest(request);

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { "data-testid": "fallback" }, "Loading...") },
        React.createElement(StatusComponent, { req: request }),
      ),
    );

    await waitFor(() => {
      const el = screen.getByTestId("status-result");
      expect(el.textContent).toContain("status:200");
      expect(el.textContent).toContain(JSON.stringify(mock));
    });
  });

  it("should pass error status through suspense result", async () => {
    function ErrorStatusComponent({ req, testId = "error-status" }: { req: any; testId?: string }) {
      const { error, status, extra } = useFetch(req, { suspense: true, dependencyTracking: false });
      return React.createElement(
        "div",
        { "data-testid": testId },
        `error:${JSON.stringify(error)},status:${status},extra:${JSON.stringify(extra)}`,
      );
    }

    mockRequest(request, { status: 400 });

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { "data-testid": "fallback" }, "Loading...") },
        React.createElement(ErrorStatusComponent, { req: request }),
      ),
    );

    await waitFor(() => {
      const el = screen.getByTestId("error-status");
      expect(el.textContent).toContain("status:400");
      expect(el.textContent).toContain("error:");
    });
  });

  it("should clean up suspense entries after data arrives", async () => {
    const req1 = createRequest({ endpoint: "/cleanup-test" as any });
    const mock = mockRequest(req1);

    function CleanupComponent({ testId = "cleanup" }: { testId?: string }) {
      const { data } = useFetch(req1, { suspense: true, dependencyTracking: false, revalidate: false });
      return React.createElement("div", { "data-testid": testId }, `data:${JSON.stringify(data)}`);
    }

    const { unmount } = render(
      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { "data-testid": "fallback" }, "Loading...") },
        React.createElement(CleanupComponent, { testId: "first-cleanup" }),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId("first-cleanup").textContent).toContain(JSON.stringify(mock));
    });

    unmount();

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { "data-testid": "fallback" }, "Loading...") },
        React.createElement(CleanupComponent, { testId: "second-cleanup" }),
      ),
    );

    expect(screen.getByTestId("second-cleanup").textContent).toContain(JSON.stringify(mock));
  });
});
