import type { HydrateDataType, ResponseType } from "@hyper-fetch/core";
import { Client, Time, xhrExtra } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useCache } from "hooks/use-cache";
import { useFetch } from "hooks/use-fetch";
import { useSubmit } from "hooks/use-submit";
import { Hydrate } from "hydrate";
import type { HydrateProps } from "hydrate";
import { StrictMode, Suspense, memo, useEffect } from "react";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

type User = { id: number; name: string };

const createClient = () => new Client({ url: "http://localhost:3000" });

const createUserRequest = (client: Client) =>
  client.createRequest<{ response: User }>()({ endpoint: "/users/:userId" }).setParams({ userId: 1 });

const createResponse = (data: User, responseTimestamp = Date.now()): ResponseType<User, any, any> => ({
  data,
  error: null,
  status: 200,
  success: true,
  extra: xhrExtra,
  requestTimestamp: responseTimestamp,
  responseTimestamp,
});

const dehydrate = (request: ReturnType<typeof createUserRequest>, data: User, responseTimestamp?: number) =>
  request.setStaleTime(Time.MIN).dehydrate({ response: createResponse(data, responseTimestamp) })!;

const server = { id: 1, name: "From server" };
const newer = { id: 1, name: "Newer" };
const older = { id: 1, name: "Older" };

describe("Hydrate", () => {
  let client: Client;
  let request: ReturnType<typeof createUserRequest>;

  beforeAll(() => startServer());
  afterEach(() => resetMocks());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = createClient();
    request = createUserRequest(client);
  });

  // Records the data of every render, so the first render can be asserted
  const createFetchView = (options: Parameters<typeof useFetch>[1] = {}, testId = "view") => {
    const renders: { data: unknown; loading: boolean }[] = [];
    const View = ({ req = request }: { req?: any }) => {
      const { data, loading } = useFetch(req, { revalidate: false, dependencyTracking: false, ...options });
      renders.push({ data, loading });
      return <div data-testid={testId}>{(data as User | null)?.name ?? "empty"}</div>;
    };
    return { View, renders };
  };

  describe("given the client renders hydrated data", () => {
    it("should render the hydrated data on the first render without a loading state", () => {
      const { View, renders } = createFetchView();

      render(
        <Hydrate client={client} data={[dehydrate(request, server)]}>
          <View />
        </Hydrate>,
      );

      expect(renders[0]).toEqual({ data: server, loading: false });
      expect(screen.getByTestId("view")).toHaveTextContent(server.name);
    });

    it("should write the data to the cache before child hooks mount", () => {
      let cacheOnMount: unknown;
      // A passive effect of a child - runs at the same time as the mount logic of the hooks
      const Probe = () => {
        useEffect(() => {
          cacheOnMount = client.cache.get(request.cacheKey)?.data;
        }, []);
        return null;
      };

      render(
        <Hydrate client={client} data={[dehydrate(request, server)]}>
          <Probe />
        </Hydrate>,
      );

      expect(cacheOnMount).toEqual(server);
      expect(client.cache.get(request.cacheKey)?.data).toEqual(server);
    });

    it("should not send a request while the hydrated data is fresh", async () => {
      const spy = vi.spyOn(client.fetchDispatcher, "add");
      const { View } = createFetchView();

      render(
        <Hydrate client={client} data={[dehydrate(request, server)]}>
          <View />
        </Hydrate>,
      );

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it("should refetch in the background when revalidation is on, without losing the hydrated data", async () => {
      const fresh = mockRequest(request, { data: { id: 1, name: "Fetched" } }) as User;
      const { View, renders } = createFetchView({ revalidate: true });

      render(
        <Hydrate client={client} data={[dehydrate(request, server)]}>
          <View />
        </Hydrate>,
      );

      expect(renders[0].data).toEqual(server);
      await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent(fresh.name));
      expect(renders.every((entry) => entry.data !== null)).toBe(true);
    });

    it("should hydrate useSubmit and useCache", () => {
      const results: Record<string, unknown> = {};
      const View = () => {
        results.submit = useSubmit(request).data;
        results.cache = useCache(request).data;
        return null;
      };

      render(
        <Hydrate client={client} data={[dehydrate(request, server)]}>
          <View />
        </Hydrate>,
      );

      expect(results.submit).toEqual(server);
      expect(results.cache).toEqual(server);
    });

    it("should not suspend when the data is hydrated", () => {
      const spy = vi.spyOn(client.fetchDispatcher, "add");
      const { View } = createFetchView({ suspense: true });

      render(
        <Suspense fallback={<div data-testid="fallback" />}>
          <Hydrate client={client} data={[dehydrate(request, server)]}>
            <View />
          </Hydrate>
        </Suspense>,
      );

      expect(screen.queryByTestId("fallback")).toBeNull();
      expect(screen.getByTestId("view")).toHaveTextContent(server.name);
      expect(spy).not.toHaveBeenCalled();
    });

    it("should keep the cache when Hydrate unmounts", () => {
      const view = render(
        <Hydrate client={client} data={[dehydrate(request, server)]}>
          <div />
        </Hydrate>,
      );

      view.unmount();

      expect(client.cache.get(request.cacheKey)?.data).toEqual(server);
    });

    it("should work in StrictMode and write every item only once", () => {
      const spy = vi.spyOn(client.cache, "set");
      const { View, renders } = createFetchView();

      render(
        <StrictMode>
          <Hydrate client={client} data={[dehydrate(request, server)]}>
            <View />
          </Hydrate>
        </StrictMode>,
      );

      expect(renders[0].data).toEqual(server);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("given several items, clients and boundaries", () => {
    it("should keep the data of two clients with the same cache key apart", () => {
      const otherClient = createClient();
      const otherRequest = createUserRequest(otherClient);
      const otherData = { id: 1, name: "Other client" };
      expect(otherRequest.cacheKey).toBe(request.cacheKey);

      const { View } = createFetchView({}, "first");
      const { View: OtherView } = createFetchView({}, "second");

      render(
        <Hydrate client={client} data={[dehydrate(request, server)]}>
          <Hydrate client={otherClient} data={[dehydrate(otherRequest, otherData)]}>
            <View />
            <OtherView req={otherRequest} />
          </Hydrate>
        </Hydrate>,
      );

      expect(screen.getByTestId("first")).toHaveTextContent(server.name);
      expect(screen.getByTestId("second")).toHaveTextContent(otherData.name);
      expect(client.cache.get(request.cacheKey)?.data).toEqual(server);
      expect(otherClient.cache.get(otherRequest.cacheKey)?.data).toEqual(otherData);
    });

    it("should serve keys from both the outer and the inner boundary", () => {
      const second = request.setParams({ userId: 2 });
      const secondData = { id: 2, name: "Second" };
      const { View } = createFetchView({}, "outer");
      const { View: InnerView } = createFetchView({}, "inner");

      render(
        <Hydrate client={client} data={[dehydrate(request, server)]}>
          <Hydrate client={client} data={[dehydrate(second, secondData)]}>
            <View />
            <InnerView req={second} />
          </Hydrate>
        </Hydrate>,
      );

      expect(screen.getByTestId("outer")).toHaveTextContent(server.name);
      expect(screen.getByTestId("inner")).toHaveTextContent(secondData.name);
    });

    it("should keep the newer data when nested boundaries hold the same key", () => {
      const now = Date.now();
      const { View } = createFetchView();

      render(
        <Hydrate client={client} data={[dehydrate(request, newer, now)]}>
          <Hydrate client={client} data={[dehydrate(request, older, now - 1000)]}>
            <View />
          </Hydrate>
        </Hydrate>,
      );

      expect(screen.getByTestId("view")).toHaveTextContent(newer.name);
      expect(client.cache.get(request.cacheKey)?.data).toEqual(newer);
    });

    it("should ignore empty data and empty items", () => {
      const { View, renders } = createFetchView();

      render(
        <>
          <Hydrate client={client} data={undefined}>
            <span />
          </Hydrate>
          <Hydrate client={client} data={null}>
            <span />
          </Hydrate>
          <Hydrate client={client} data={[]}>
            <span />
          </Hydrate>
          <Hydrate client={client} data={[null, undefined, dehydrate(request, server)]}>
            <View />
          </Hydrate>
        </>,
      );

      expect(renders[0].data).toEqual(server);
    });

    it("should hydrate when rendered conditionally later", () => {
      const { View, renders } = createFetchView();
      const items = [dehydrate(request, server)];
      const App = ({ show }: { show: boolean }) =>
        show ? (
          <Hydrate client={client} data={items}>
            <View />
          </Hydrate>
        ) : null;

      const view = render(<App show={false} />);
      expect(client.cache.get(request.cacheKey)).toBeUndefined();

      view.rerender(<App show />);
      expect(renders[0].data).toEqual(server);
      expect(client.cache.get(request.cacheKey)?.data).toEqual(server);
    });
  });

  describe("given the cache already has data", () => {
    const setCache = (data: User, responseTimestamp: number) => {
      client.cache.set(request, {
        ...createResponse(data, responseTimestamp),
        ...createDetails(responseTimestamp),
      } as any);
    };

    it("should not replace newer cache data with an older snapshot", () => {
      const now = Date.now();
      setCache(newer, now);
      const { View, renders } = createFetchView();

      render(
        <Hydrate client={client} data={[dehydrate(request, older, now - 1000)]}>
          <View />
        </Hydrate>,
      );

      expect(renders[0].data).toEqual(newer);
      expect(client.cache.get(request.cacheKey)?.data).toEqual(newer);
    });

    it("should replace older cache data and update hooks that already show it", () => {
      const now = Date.now();
      setCache(older, now - 1000);
      const { View: Outside } = createFetchView({}, "outside");
      const { View, renders } = createFetchView({}, "inside");

      render(
        <>
          <Outside />
          <Hydrate client={client} data={[dehydrate(request, newer, now)]}>
            <View />
          </Hydrate>
        </>,
      );

      expect(renders[0].data).toEqual(newer);
      expect(screen.getByTestId("outside")).toHaveTextContent(newer.name);
      expect(client.cache.get(request.cacheKey)?.data).toEqual(newer);
    });

    it("should keep existing cache data when override is false", () => {
      const now = Date.now();
      setCache(older, now - 1000);
      const { View, renders } = createFetchView();

      render(
        <Hydrate client={client} data={[dehydrate(request, newer, now)]} options={{ override: false }}>
          <View />
        </Hydrate>,
      );

      expect(renders[0].data).toEqual(older);
      expect(client.cache.get(request.cacheKey)?.data).toEqual(older);
    });

    it("should still hydrate empty keys when override is false", () => {
      const { View, renders } = createFetchView();

      render(
        <Hydrate client={client} data={[dehydrate(request, server)]} options={{ override: false }}>
          <View />
        </Hydrate>,
      );

      expect(renders[0].data).toEqual(server);
      expect(client.cache.get(request.cacheKey)?.data).toEqual(server);
    });

    it("should not resurrect the snapshot for hooks mounted after the cache was cleared", async () => {
      const items = [dehydrate(request, server)];
      mockRequest(request, { data: { id: 1, name: "Fetched" }, delay: 50 });
      const { View: First } = createFetchView({}, "first");
      const { View: Second, renders } = createFetchView({}, "second");
      const App = ({ showSecond }: { showSecond: boolean }) => (
        <Hydrate client={client} data={items}>
          <First />
          {showSecond && <Second />}
        </Hydrate>
      );

      const view = render(<App showSecond={false} />);
      await act(async () => {
        await client.cache.clear();
      });
      view.rerender(<App showSecond />);

      expect(renders[0].data).toBeNull();
    });
  });

  describe("given options and re-renders", () => {
    it("should not write the snapshot again when re-rendered after the cache was cleared", async () => {
      const items = [dehydrate(request, server)];
      // Inline options create new entries on every render, so the effect runs again
      const view = render(<Hydrate client={client} data={items} options={{ cache: true }} />);
      expect(client.cache.get(request.cacheKey)?.data).toEqual(server);

      await act(async () => {
        await client.cache.clear();
      });
      view.rerender(<Hydrate client={client} data={items} options={{ cache: true }} />);

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should not re-render memoized children when Hydrate re-renders", () => {
      const renders = vi.fn();
      const Child = memo(() => {
        renders();
        useFetch(request, { revalidate: false });
        return null;
      });
      const items = [dehydrate(request, server)];
      const child = <Child />;
      const view = render(
        <Hydrate client={client} data={items} options={{ cache: true }}>
          {child}
        </Hydrate>,
      );

      view.rerender(
        <Hydrate client={client} data={items} options={{ cache: true }}>
          {child}
        </Hydrate>,
      );

      expect(renders).toHaveBeenCalledTimes(1);
    });

    it("should apply options given as an object", () => {
      render(<Hydrate client={client} data={[dehydrate(request, server)]} options={{ staleTime: Time.HOUR }} />);

      expect(client.cache.get(request.cacheKey)?.staleTime).toBe(Time.HOUR);
    });

    it("should apply options given as a function of the item", () => {
      const options = vi.fn((item: HydrateDataType) => ({ cacheTime: item.cacheKey ? Time.DAY : 0 }));

      render(<Hydrate client={client} data={[dehydrate(request, server)]} options={options} />);

      expect(options).toHaveBeenCalled();
      expect(client.cache.get(request.cacheKey)?.cacheTime).toBe(Time.DAY);
    });

    it("should not write again when re-rendered with the same items", () => {
      const spy = vi.spyOn(client.cache, "set");
      const items = [dehydrate(request, server)];
      const view = render(<Hydrate client={client} data={items} />);

      view.rerender(<Hydrate client={client} data={items} />);
      view.rerender(<Hydrate client={client} data={[...items]} />);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should write a new snapshot with newer data", () => {
      const now = Date.now();
      const { View } = createFetchView();
      const view = render(
        <Hydrate client={client} data={[dehydrate(request, older, now - 1000)]}>
          <View />
        </Hydrate>,
      );

      view.rerender(
        <Hydrate client={client} data={[dehydrate(request, newer, now)]}>
          <View />
        </Hydrate>,
      );

      expect(client.cache.get(request.cacheKey)?.data).toEqual(newer);
      expect(screen.getByTestId("view")).toHaveTextContent(newer.name);
    });
  });

  describe("given scoped requests", () => {
    it("should hydrate only the matching scope", () => {
      const scoped = request.setScope("session-1");
      const { View: ScopedView } = createFetchView({}, "scoped");
      const { View: PlainView } = createFetchView({}, "plain");

      render(
        <Hydrate client={client} data={[dehydrate(scoped, server)]}>
          <ScopedView req={scoped} />
          <PlainView req={request} />
        </Hydrate>,
      );

      expect(screen.getByTestId("scoped")).toHaveTextContent(server.name);
      expect(screen.getByTestId("plain")).toHaveTextContent("empty");
    });
  });

  describe("types", () => {
    it("should accept the output of dehydrate and empty values", () => {
      expectTypeOf(request.dehydrate()).toMatchTypeOf<NonNullable<HydrateProps["data"]>[number]>();
      expectTypeOf<null>().toMatchTypeOf<HydrateProps["data"]>();
      expectTypeOf<undefined>().toMatchTypeOf<HydrateProps["data"]>();
      expectTypeOf<{ staleTime: number }>().toMatchTypeOf<HydrateProps["options"]>();
      expectTypeOf<(item: HydrateDataType) => { override: boolean }>().toMatchTypeOf<HydrateProps["options"]>();
      // @ts-expect-error client is required
      expectTypeOf<{ data: [] }>().toMatchTypeOf<HydrateProps>();
    });
  });
});

const createDetails = (timestamp: number) => ({
  retries: 0,
  isCanceled: false,
  isOffline: false,
  willRetry: false,
  addedTimestamp: timestamp,
  triggerTimestamp: timestamp,
});
