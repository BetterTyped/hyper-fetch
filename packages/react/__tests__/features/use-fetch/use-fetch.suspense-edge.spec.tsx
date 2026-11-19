import type { RequestInstance } from "@hyper-fetch/core";
import { Client } from "@hyper-fetch/core";
import { act, render, screen } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import type { ReactNode } from "react";
import { Component, StrictMode, Suspense } from "react";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleReset = () => {
    // oxlint-disable-next-line react/no-set-state -- error boundaries have to be class components
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <button type="button" data-testid="boundary" onClick={this.handleReset}>
          {error.message}
        </button>
      );
    }
    return this.props.children;
  }
}

const Page = ({
  request,
  name = "page",
  throwOnError = false,
}: {
  request: RequestInstance;
  name?: string;
  throwOnError?: boolean;
}) => {
  const { data, error, loading, success } = useFetch(request, { suspense: true, throwOnError });
  return <div data-testid={name}>{JSON.stringify({ data, error: error?.message ?? null, loading, success })}</div>;
};

const Fallback = ({ name = "fallback" }: { name?: string }) => <div data-testid={name}>loading</div>;

const read = (name = "page") => JSON.parse(screen.getByTestId(name).textContent || "{}");

describe("useFetch [ Suspense Edge Cases ]", () => {
  let request = createRequest<{ value: number } | null>();
  let calls = gateRequest(request);

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<{ value: number } | null>();
    calls = gateRequest(request);
    vi.spyOn(console, "error").mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("when the request resolves", () => {
    it("should send a single request for the suspended component", async () => {
      render(
        <Suspense fallback={<Fallback />}>
          <Page request={request} />
        </Suspense>,
      );
      await advance();
      calls[0].succeed({ value: 1 });
      await settle();
      await advance(5000);

      expect(read().data).toStrictEqual({ value: 1 });
      expect(calls).toHaveLength(1);
    });
    it("should not be in the loading state after resolving", async () => {
      render(
        <Suspense fallback={<Fallback />}>
          <Page request={request} />
        </Suspense>,
      );
      await advance();
      calls[0].succeed({ value: 1 });
      await settle();

      expect(read()).toStrictEqual({ data: { value: 1 }, error: null, loading: false, success: true });
    });
    it("should send a single request for many components using the same request", async () => {
      render(
        <Suspense fallback={<Fallback />}>
          <Page request={request} name="first" />
          <Page request={request} name="second" />
          <Page request={request} name="third" />
        </Suspense>,
      );
      await advance();
      calls[0].succeed({ value: 1 });
      await settle();
      await advance(5000);

      expect(read("first").data).toStrictEqual({ value: 1 });
      expect(read("second").data).toStrictEqual({ value: 1 });
      expect(read("third").data).toStrictEqual({ value: 1 });
      expect(calls).toHaveLength(1);
    });
    it("should send a single request in StrictMode", async () => {
      render(
        <StrictMode>
          <Suspense fallback={<Fallback />}>
            <Page request={request} />
          </Suspense>
        </StrictMode>,
      );
      await advance();
      calls[0].succeed({ value: 1 });
      await settle();
      await advance(5000);

      expect(read().data).toStrictEqual({ value: 1 });
      expect(calls).toHaveLength(1);
    });
    it("should finish suspending when the response has no data", async () => {
      render(
        <Suspense fallback={<Fallback />}>
          <Page request={request} />
        </Suspense>,
      );
      await advance();
      calls[0].succeed(null, 204);
      await settle();
      await settle();

      expect(read()).toStrictEqual({ data: null, error: null, loading: false, success: true });
      expect(calls).toHaveLength(1);
    });
    it("should render the error response once and not request again", async () => {
      render(
        <Suspense fallback={<Fallback />}>
          <Page request={request} />
        </Suspense>,
      );
      await advance();
      calls[0].fail(new Error("Failed"));
      await settle();
      await advance(5000);

      expect(read()).toStrictEqual({ data: null, error: "Failed", loading: false, success: false });
      expect(calls).toHaveLength(1);
    });
  });

  describe("when the cache has data", () => {
    it("should revalidate cached data that was not fetched by the suspended component", async () => {
      setCacheResponse(request, { value: 1 });
      await advance(5000);

      render(
        <Suspense fallback={<Fallback />}>
          <Page request={request} />
        </Suspense>,
      );
      await advance();

      expect(screen.queryByTestId("fallback")).toBeNull();
      expect(read().data).toStrictEqual({ value: 1 });
      expect(calls).toHaveLength(1);
    });
  });

  describe("when the suspended component is gone before the response", () => {
    it("should not reuse the outdated response on the next mount", async () => {
      const view = render(
        <Suspense fallback={<Fallback />}>
          <Page request={request} />
        </Suspense>,
      );
      await advance();
      view.unmount();
      calls[0].fail(new Error("Old failure"));
      await settle();

      // User comes back after a while
      await advance(60_000);
      render(
        <Suspense fallback={<Fallback />}>
          <Page request={request} />
        </Suspense>,
      );
      await advance();

      expect(screen.getByTestId("fallback")).toBeInTheDocument();
      expect(calls).toHaveLength(2);

      calls[1].succeed({ value: 2 });
      await settle();

      expect(read()).toStrictEqual({ data: { value: 2 }, error: null, loading: false, success: true });
    });
  });

  describe("when two clients use the same endpoint", () => {
    const createClients = () => {
      const clientA = new Client({ url: "http://a.test" });
      const clientB = new Client({ url: "http://b.test" });
      const requestA = clientA.createRequest<{ response: string }>()({ endpoint: "/same" });
      const requestB = clientB.createRequest<{ response: string }>()({ endpoint: "/same" });
      return { requestA, requestB, callsA: gateRequest(requestA), callsB: gateRequest(requestB) };
    };

    it("should not give the response of one client to the other", async () => {
      const { requestA, requestB, callsA, callsB } = createClients();
      const viewA = render(
        <Suspense fallback={<Fallback name="fallback-a" />}>
          <Page request={requestA} name="a" />
        </Suspense>,
      );
      await advance();
      render(
        <Suspense fallback={<Fallback name="fallback-b" />}>
          <Page request={requestB} name="b" />
        </Suspense>,
      );
      await advance();

      viewA.unmount();
      callsA[0].succeed("data-a");
      await settle();

      expect(screen.queryByTestId("b")).toBeNull();
      expect(screen.getByTestId("fallback-b")).toBeInTheDocument();

      callsB[0].succeed("data-b");
      await settle();

      expect(read("b").data).toBe("data-b");
    });
    it("should resolve each client with its own response", async () => {
      const { requestA, requestB, callsA, callsB } = createClients();
      render(
        <>
          <Suspense fallback={<Fallback name="fallback-a" />}>
            <Page request={requestA} name="a" />
          </Suspense>
          <Suspense fallback={<Fallback name="fallback-b" />}>
            <Page request={requestB} name="b" />
          </Suspense>
        </>,
      );
      await advance();

      callsB[0].succeed("data-b");
      await settle();
      expect(read("b").data).toBe("data-b");
      expect(screen.getByTestId("fallback-a")).toBeInTheDocument();

      callsA[0].succeed("data-a");
      await settle();
      expect(read("a").data).toBe("data-a");
    });
  });

  describe("when two scopes use the same request", () => {
    it("should resolve each scope with its own response", async () => {
      const scopedA = request.setScope("a");
      const scopedB = request.setScope("b");
      render(
        <>
          <Suspense fallback={<Fallback name="fallback-a" />}>
            <Page request={scopedA} name="a" />
          </Suspense>
          <Suspense fallback={<Fallback name="fallback-b" />}>
            <Page request={scopedB} name="b" />
          </Suspense>
        </>,
      );
      await advance();
      expect(calls).toHaveLength(2);

      calls.find((call) => call.request.scope === "b")?.succeed({ value: 2 });
      await settle();

      expect(read("b").data).toStrictEqual({ value: 2 });
      expect(screen.getByTestId("fallback-a")).toBeInTheDocument();

      calls.find((call) => call.request.scope === "a")?.succeed({ value: 1 });
      await settle();

      expect(read("a").data).toStrictEqual({ value: 1 });
    });
  });

  describe("when the key changes", () => {
    it("should suspend again without rendering the previous resource", async () => {
      const userRequest = createRequest<{ id: number }, any, "/users/:id">({ endpoint: "/users/:id" });
      const userCalls = gateRequest(userRequest);
      const rendered: { id: number; dataId: number | undefined }[] = [];
      const User = ({ id }: { id: number }) => {
        const { data } = useFetch(userRequest.setParams({ id }), { suspense: true });
        rendered.push({ id, dataId: data?.id });
        return <div data-testid="user">{data?.id}</div>;
      };
      const view = render(
        <Suspense fallback={<Fallback />}>
          <User id={1} />
        </Suspense>,
      );
      await advance();
      userCalls[0].succeed({ id: 1 });
      await settle();
      expect(screen.getByTestId("user").textContent).toBe("1");

      view.rerender(
        <Suspense fallback={<Fallback />}>
          <User id={2} />
        </Suspense>,
      );
      await advance();
      expect(screen.getByTestId("fallback")).toBeInTheDocument();

      userCalls[1].succeed({ id: 2 });
      await settle();

      expect(screen.getByTestId("user").textContent).toBe("2");
      expect(rendered.filter((item) => item.id !== item.dataId)).toStrictEqual([]);
    });
  });

  describe("when combined with the error boundary", () => {
    it("should throw the error, and fetch again after the boundary reset", async () => {
      render(
        <ErrorBoundary>
          <Suspense fallback={<Fallback />}>
            <Page request={request} throwOnError />
          </Suspense>
        </ErrorBoundary>,
      );
      await advance();
      calls[0].fail(new Error("Failed"));
      await settle();

      expect(screen.getByTestId("boundary").textContent).toBe("Failed");
      expect(calls).toHaveLength(1);

      act(() => {
        screen.getByTestId("boundary").click();
      });
      await advance();

      expect(screen.getByTestId("fallback")).toBeInTheDocument();
      expect(calls).toHaveLength(2);

      calls[1].succeed({ value: 1 });
      await settle();

      expect(read()).toStrictEqual({ data: { value: 1 }, error: null, loading: false, success: true });
    });
    it("should throw again when the request fails again after the reset", async () => {
      render(
        <ErrorBoundary>
          <Suspense fallback={<Fallback />}>
            <Page request={request} throwOnError />
          </Suspense>
        </ErrorBoundary>,
      );
      await advance();
      calls[0].fail(new Error("First"));
      await settle();

      act(() => {
        screen.getByTestId("boundary").click();
      });
      await advance();
      calls[1].fail(new Error("Second"));
      await settle();

      expect(screen.getByTestId("boundary").textContent).toBe("Second");
    });
  });
});
