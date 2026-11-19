// @vitest-environment node
import type { RequestInstance } from "@hyper-fetch/core";
import { Client } from "@hyper-fetch/core";
import { useCache } from "hooks/use-cache";
import type { UseFetchOptionsType } from "hooks/use-fetch";
import { useFetch } from "hooks/use-fetch";
import { useIsFetching } from "hooks/use-is-fetching";
import { Provider } from "provider";
import { Suspense } from "react";
import { renderToString } from "react-dom/server";

type User = { id: number; name: string };

const user: User = { id: 1, name: "Maciej" };

const countListeners = (client: Client) => {
  return [client.requestManager.emitter, client.cache.emitter, client.fetchDispatcher.emitter].reduce(
    (sum, emitter) => sum + emitter.eventNames().reduce((count, name) => count + emitter.listenerCount(name), 0),
    0,
  );
};

/**
 * Server rendering - there is no window, effects never run and nothing can be left behind after the render
 */
describe("useFetch [ Server Side Rendering ]", () => {
  let client = new Client({ url: "http://localhost" });
  let request = client.createRequest<{ response: User }>()({ endpoint: "/users/1" });
  let mock = vi.fn();

  const Page = <T extends RequestInstance>({ req, options }: { req: T; options?: UseFetchOptionsType<T> }) => {
    const { data, loading, error, success } = useFetch(req, options);
    return <div>{JSON.stringify({ data, loading, error, success })}</div>;
  };

  const readMarkup = (markup: string) => {
    const json = markup.replaceAll(/<[^>]+>/g, "").replaceAll("&quot;", '"');
    return JSON.parse(json);
  };

  const saveScopedResponse = (scope: string) => {
    const scoped = request.setScope(scope);
    client.cache.set(scoped, {
      data: user,
      error: null,
      status: 200,
      success: true,
      extra: client.adapter.defaultExtra,
      requestTimestamp: Date.now(),
      responseTimestamp: Date.now(),
      addedTimestamp: Date.now(),
      triggerTimestamp: Date.now(),
      retries: 0,
      isCanceled: false,
      isOffline: false,
      willRetry: false,
    });
    return scoped;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client = new Client({ url: "http://localhost" });
    mock = vi.fn(() => ({ data: user, status: 200 }));
    request = client.createRequest<{ response: User }>()({ endpoint: "/users/1" }).setMock(mock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should run without the window", () => {
    expect(typeof window).toBe("undefined");
    expect(client.mode).toBe("server");
  });

  describe("when there is no data", () => {
    it("should render the loading state", () => {
      const markup = renderToString(<Page req={request} />);

      expect(readMarkup(markup)).toStrictEqual({ data: null, loading: true, error: null, success: false });
    });
    it("should not send any request", async () => {
      renderToString(<Page req={request} />);
      await vi.advanceTimersByTimeAsync(1000);

      expect(mock).not.toHaveBeenCalled();
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(client.fetchDispatcher.getQueuesKeys()).toHaveLength(0);
    });
    it("should not leave any timers", () => {
      renderToString(
        <Page req={request} options={{ refresh: true, refreshTime: 1000, bounce: true, dependencies: [1] }} />,
      );

      expect(vi.getTimerCount()).toBe(0);
    });
    it("should not leave any listeners", () => {
      const baseline = countListeners(client);

      renderToString(<Page req={request} />);

      expect(countListeners(client)).toBe(baseline);
    });
    it("should render the idle state when disabled", () => {
      const markup = renderToString(<Page req={request} options={{ disabled: true }} />);

      expect(readMarkup(markup)).toStrictEqual({ data: null, loading: false, error: null, success: false });
    });
    it("should render the same markup every time", () => {
      const first = renderToString(<Page req={request} />);
      const second = renderToString(<Page req={request} />);

      expect(second).toBe(first);
    });
  });

  describe("when the data is available", () => {
    it("should render the initial response", () => {
      const markup = renderToString(<Page req={request} options={{ initialResponse: { data: user } }} />);

      expect(readMarkup(markup).data).toStrictEqual(user);
      expect(readMarkup(markup).success).toBeTrue();
    });
    it("should render the data cached for the scope of the request", () => {
      const scoped = saveScopedResponse("session-1");

      const markup = renderToString(<Page req={scoped} options={{ revalidate: false }} />);

      expect(readMarkup(markup)).toStrictEqual({ data: user, loading: false, error: null, success: true });
    });
    it("should not render the data of another scope", () => {
      saveScopedResponse("session-1");

      const markup = renderToString(<Page req={request.setScope("session-2")} options={{ revalidate: false }} />);

      expect(readMarkup(markup).data).toBeNull();
    });
    it("should render the data fetched on the server before rendering", async () => {
      const scoped = request.setScope("session-1");
      const sending = scoped.send();
      await vi.advanceTimersByTimeAsync(1000);
      await sending;

      const markup = renderToString(<Page req={scoped} />);

      expect(readMarkup(markup).data).toStrictEqual(user);
      expect(mock).toHaveBeenCalledOnce();
    });
    it("should apply the selector", () => {
      const scoped = saveScopedResponse("session-1");
      const Name = () => {
        const { data } = useFetch(scoped, { select: (value) => value.name });
        return <div>{data}</div>;
      };

      expect(renderToString(<Name />)).toContain("Maciej");
    });
  });

  describe("when other hooks are rendered on the server", () => {
    it("should render the cached data with useCache", () => {
      const scoped = saveScopedResponse("session-1");
      const Cached = () => <div>{useCache(scoped).data?.name}</div>;

      expect(renderToString(<Cached />)).toContain("Maciej");
    });
    it("should render zero running requests with useIsFetching", () => {
      const Counter = () => <div>{useIsFetching(client)}</div>;

      expect(renderToString(<Counter />)).toBe("<div>0</div>");
    });
    it("should read the provider config", () => {
      const markup = renderToString(
        <Provider config={{ useFetchConfig: { disabled: true } }}>
          <Page req={request} />
        </Provider>,
      );

      expect(readMarkup(markup).loading).toBeFalse();
    });
    it("should render the suspense fallback for the missing data", () => {
      const Suspended = () => <div>{useFetch(request, { suspense: true }).data?.name}</div>;

      const markup = renderToString(
        <Suspense fallback={<span>fallback</span>}>
          <Suspended />
        </Suspense>,
      );

      expect(markup).toContain("fallback");
      expect(markup).not.toContain("Maciej");
    });
  });
});
