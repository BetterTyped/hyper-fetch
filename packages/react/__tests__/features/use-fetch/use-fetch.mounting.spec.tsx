import type { RequestInstance } from "@hyper-fetch/core";
import { act, render, renderHook, screen } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { Activity, StrictMode } from "react";

import { client, createRequest } from "../../utils";
import { advance, countListeners, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

type User = { id: number };

const View = ({ request, name }: { request: RequestInstance; name: string }) => {
  const { data, loading, error } = useFetch(request);
  return <div data-testid={name}>{JSON.stringify({ data, loading, error: error?.message ?? null })}</div>;
};

const read = (name: string) => JSON.parse(screen.getByTestId(name).textContent || "{}");

describe("useFetch [ Mounting ]", () => {
  let request = createRequest<User, any, "/users/:id">({ endpoint: "/users/:id" });
  let calls = gateRequest(request);

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<User, any, "/users/:id">({ endpoint: "/users/:id" });
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("when rendered in StrictMode", () => {
    it("should send one request on mount", async () => {
      render(<View request={request.setParams({ id: 1 })} name="user" />, { wrapper: StrictMode });
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should receive the response", async () => {
      render(<View request={request.setParams({ id: 1 })} name="user" />, { wrapper: StrictMode });
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      expect(read("user")).toStrictEqual({ data: { id: 1 }, loading: false, error: null });
    });
    it("should send one request per key change", async () => {
      const view = render(<View request={request.setParams({ id: 1 })} name="user" />, { wrapper: StrictMode });
      await advance();
      view.rerender(<View request={request.setParams({ id: 2 })} name="user" />);
      await advance();
      view.rerender(<View request={request.setParams({ id: 3 })} name="user" />);
      await advance();

      expect(calls.map((call) => call.request.endpoint)).toStrictEqual(["/users/1", "/users/2", "/users/3"]);
    });
    it("should send one request per refetch", async () => {
      const { result } = renderHook(
        () => {
          const { data, refetch } = useFetch(request.setParams({ id: 1 }));
          return { data, refetch };
        },
        { wrapper: StrictMode },
      );
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should not send any request for fresh cache without revalidation", async () => {
      setCacheResponse(request.setParams({ id: 1 }), { id: 1 });
      const { result } = renderHook(() => useFetch(request.setParams({ id: 1 }), { revalidate: false }).data, {
        wrapper: StrictMode,
      });
      await advance();

      expect(calls).toHaveLength(0);
      expect(result.current).toStrictEqual({ id: 1 });
    });
    it("should leave no listeners after unmount", async () => {
      const baseline = countListeners(client);
      const { unmount } = render(<View request={request.setParams({ id: 1 })} name="user" />, {
        wrapper: StrictMode,
      });
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      unmount();

      expect(countListeners(client)).toStrictEqual(baseline);
    });
  });

  describe("when rendered inside of Activity", () => {
    const App = ({ id, hidden }: { id: number; hidden: boolean }) => (
      <Activity mode={hidden ? "hidden" : "visible"}>
        <View request={request.setParams({ id })} name="user" />
      </Activity>
    );

    it("should fetch the key changed while hidden once it is revealed", async () => {
      const view = render(<App id={1} hidden={false} />);
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      view.rerender(<App id={1} hidden />);
      view.rerender(<App id={2} hidden />);
      await advance();
      view.rerender(<App id={2} hidden={false} />);
      await advance();

      expect(calls.map((call) => call.request.endpoint)).toStrictEqual(["/users/1", "/users/2"]);

      calls[1].succeed({ id: 2 });
      await settle();

      expect(read("user")).toStrictEqual({ data: { id: 2 }, loading: false, error: null });
    });
    it("should not fetch again when revealed without changes", async () => {
      const view = render(<App id={1} hidden={false} />);
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      view.rerender(<App id={1} hidden />);
      view.rerender(<App id={1} hidden={false} />);
      await advance();

      expect(calls).toHaveLength(1);
      expect(read("user").data).toStrictEqual({ id: 1 });
    });
    it("should receive cache updates after it is revealed", async () => {
      const view = render(<App id={1} hidden={false} />);
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      view.rerender(<App id={1} hidden />);
      view.rerender(<App id={1} hidden={false} />);
      act(() => {
        setCacheResponse(request.setParams({ id: 1 }), { id: 100 });
      });

      expect(read("user").data).toStrictEqual({ id: 100 });
    });
  });

  describe("when the hook unmounts during the request", () => {
    it("should not report any React warning", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => null);
      const { unmount } = render(<View request={request.setParams({ id: 1 })} name="user" />);
      await advance();

      unmount();
      calls[0].succeed({ id: 1 });
      await settle();

      expect(consoleError).not.toHaveBeenCalled();
    });
    it("should let the request finish and save the response in the cache", async () => {
      const { unmount } = render(<View request={request.setParams({ id: 1 })} name="user" />);
      await advance();

      unmount();
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(1);
      calls[0].succeed({ id: 1 });
      await settle();

      expect(client.cache.get(request.setParams({ id: 1 }).cacheKey)?.data).toStrictEqual({ id: 1 });
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
    });
    it("should use the response of the finished request on the next mount", async () => {
      const first = render(<View request={request.setParams({ id: 1 })} name="user" />);
      await advance();
      first.unmount();
      calls[0].succeed({ id: 1 });
      await settle();

      const { result } = renderHook(() => useFetch(request.setParams({ id: 1 }), { revalidate: false }).data);
      await advance();

      expect(result.current).toStrictEqual({ id: 1 });
      expect(calls).toHaveLength(1);
    });
    it("should join the request left by the unmounted hook", async () => {
      const first = render(<View request={request.setParams({ id: 1 })} name="user" />);
      await advance();
      first.unmount();

      render(<View request={request.setParams({ id: 1 })} name="user" />);
      await advance();
      expect(calls).toHaveLength(1);

      calls[0].succeed({ id: 1 });
      await settle();

      expect(read("user")).toStrictEqual({ data: { id: 1 }, loading: false, error: null });
    });
  });

  describe("when hooks mount and unmount", () => {
    it("should bring the listeners count back to the baseline", async () => {
      const baseline = countListeners(client);
      const { unmount } = render(<View request={request.setParams({ id: 1 })} name="user" />);
      await advance();
      expect(countListeners(client)).not.toStrictEqual(baseline);

      unmount();

      expect(countListeners(client)).toStrictEqual(baseline);
    });
    it("should not accumulate listeners over many mounts", async () => {
      const baseline = countListeners(client);

      for (let i = 0; i < 20; i += 1) {
        const { unmount } = render(<View request={request.setParams({ id: i })} name="user" />);
        unmount();
      }

      expect(countListeners(client)).toStrictEqual(baseline);
    });
    it("should not accumulate listeners over many key changes", async () => {
      const view = render(<View request={request.setParams({ id: 0 })} name="user" />);
      const mounted = countListeners(client);

      for (let i = 1; i < 20; i += 1) {
        view.rerender(<View request={request.setParams({ id: i })} name="user" />);
      }

      expect(countListeners(client)).toStrictEqual(mounted);
    });
    it("should not accumulate listeners over many rerenders", async () => {
      const view = render(<View request={request.setParams({ id: 1 })} name="user" />);
      const mounted = countListeners(client);

      for (let i = 0; i < 20; i += 1) {
        view.rerender(<View request={request.setParams({ id: 1 })} name="user" />);
      }

      expect(countListeners(client)).toStrictEqual(mounted);
    });
    it("should leave no timers besides the cache garbage collector", async () => {
      const { unmount } = renderHook(() =>
        useFetch(request.setParams({ id: 1 }), {
          refresh: true,
          refreshTime: 1000,
          bounce: true,
          bounceTime: 500,
          dependencies: [1],
        }),
      );
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      unmount();
      client.cache.clear();

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("when many components use the same request", () => {
    const sameRequest = () => request.setParams({ id: 1 });

    it("should send one request and update all of them", async () => {
      render(
        <>
          <View request={sameRequest()} name="first" />
          <View request={sameRequest()} name="second" />
          <View request={sameRequest()} name="third" />
        </>,
      );
      await advance();
      expect(calls).toHaveLength(1);

      calls[0].succeed({ id: 1 });
      await settle();

      ["first", "second", "third"].forEach((name) => {
        expect(read(name)).toStrictEqual({ data: { id: 1 }, loading: false, error: null });
      });
    });
    it("should show the loading state in all of them", async () => {
      render(
        <>
          <View request={sameRequest()} name="first" />
          <View request={sameRequest()} name="second" />
        </>,
      );
      await advance();

      expect(read("first").loading).toBeTrue();
      expect(read("second").loading).toBeTrue();
    });
    it("should show the error in all of them", async () => {
      render(
        <>
          <View request={sameRequest()} name="first" />
          <View request={sameRequest()} name="second" />
        </>,
      );
      await advance();
      calls[0].fail(new Error("Failed"));
      await settle();

      expect(read("first").error).toBe("Failed");
      expect(read("second").error).toBe("Failed");
    });
    it("should keep the request running when one of them unmounts", async () => {
      const first = render(<View request={sameRequest()} name="first" />);
      render(<View request={sameRequest()} name="second" />);
      await advance();

      first.unmount();
      calls[0].succeed({ id: 1 });
      await settle();

      expect(calls).toHaveLength(1);
      expect(read("second")).toStrictEqual({ data: { id: 1 }, loading: false, error: null });
    });
    it("should give the cached data to the component mounted later", async () => {
      render(<View request={sameRequest()} name="first" />);
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      const { result } = renderHook(() => useFetch(sameRequest(), { revalidate: false }).data);

      expect(result.current).toStrictEqual({ id: 1 });
      expect(calls).toHaveLength(1);
    });
    it("should update all of them when one refetches", async () => {
      render(<View request={sameRequest()} name="first" />);
      const { result } = renderHook(() => {
        const { data, refetch } = useFetch(sameRequest());
        return { data, refetch };
      });
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      expect(read("first").loading).toBeTrue();

      calls[1].succeed({ id: 2 });
      await settle();

      expect(read("first").data).toStrictEqual({ id: 2 });
      expect(result.current.data).toStrictEqual({ id: 2 });
    });
    it("should keep the data set locally in one of them out of the others", async () => {
      render(<View request={sameRequest()} name="first" />);
      const { result } = renderHook(() => {
        const { data, setData } = useFetch(sameRequest());
        return { data, setData };
      });
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      act(() => {
        result.current.setData({ id: 50 });
      });

      expect(result.current.data).toStrictEqual({ id: 50 });
      expect(read("first").data).toStrictEqual({ id: 1 });
      expect(client.cache.get(sameRequest().cacheKey)?.data).toStrictEqual({ id: 1 });
    });
  });

  describe("when one component uses two requests", () => {
    it("should keep their states independent", async () => {
      const { result } = renderHook(() => {
        const first = useFetch(request.setParams({ id: 1 }));
        const second = useFetch(request.setParams({ id: 2 }));
        return {
          first: { data: first.data, loading: first.loading, error: first.error?.message ?? null },
          second: { data: second.data, loading: second.loading, error: second.error?.message ?? null },
        };
      });
      await advance();
      expect(calls).toHaveLength(2);

      calls[1].fail(new Error("Second failed"));
      await settle();

      expect(result.current.first).toStrictEqual({ data: null, loading: true, error: null });
      expect(result.current.second).toStrictEqual({ data: null, loading: false, error: "Second failed" });

      calls[0].succeed({ id: 1 });
      await settle();

      expect(result.current.first).toStrictEqual({ data: { id: 1 }, loading: false, error: null });
      expect(result.current.second).toStrictEqual({ data: null, loading: false, error: "Second failed" });
    });
  });
});
