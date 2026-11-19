import type { ResponseType } from "@hyper-fetch/core";
import { Client, Time, xhrExtra } from "@hyper-fetch/core";
import { act } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useSubmit } from "hooks/use-submit";
import { Hydrate } from "hydrate";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

type User = { id: number; name: string };

const createRequest = (client: Client, userId = 1) =>
  client
    .createRequest<{ response: User }>()({ endpoint: "/users/:userId" })
    .setParams({ userId })
    .setStaleTime(Time.MIN);

const createResponse = (data: User, responseTimestamp = Date.now()): ResponseType<User, any, any> => ({
  data,
  error: null,
  status: 200,
  success: true,
  extra: xhrExtra,
  requestTimestamp: responseTimestamp,
  responseTimestamp,
});

// Dehydrated payloads cross the network as JSON (structuredClone would keep values JSON drops)
// oxlint-disable-next-line unicorn/prefer-structured-clone
const toWire = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const UserName = ({ request }: { request: ReturnType<typeof createRequest> }) => {
  const { data, loading } = useFetch(request, { revalidate: false });
  return <span data-loading={String(loading)}>{data?.name ?? "empty"}</span>;
};

const App = ({ client, data, userIds = [1] }: { client: Client; data: any[]; userIds?: number[] }) => (
  <Hydrate client={client} data={data}>
    {userIds.map((userId) => (
      <UserName key={userId} request={createRequest(client, userId)} />
    ))}
  </Hydrate>
);

describe("Hydrate [ Server rendering ]", () => {
  describe("given a server mode client", () => {
    it("should render the hydrated data into the markup", () => {
      const client = new Client({ url: "http://localhost:3000", mode: "server" });
      const request = createRequest(client);
      const data = [request.dehydrate({ response: createResponse({ id: 1, name: "Server user" }) })];

      const html = renderToString(<App client={client} data={data} />);

      expect(html).toContain("Server user");
      expect(html).toContain('data-loading="false"');
    });

    it("should not store anything in the server cache", () => {
      const client = new Client({ url: "http://localhost:3000", mode: "server" });
      const request = createRequest(client);
      const data = [request.dehydrate({ response: createResponse({ id: 1, name: "Server user" }) })];

      renderToString(<App client={client} data={data} />);

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
      expect([...client.cache.storage.keys()]).toHaveLength(0);
    });

    it("should not leak data between two server renders sharing one client", () => {
      const client = new Client({ url: "http://localhost:3000", mode: "server" });
      const request = createRequest(client);

      const first = renderToString(
        <App client={client} data={[request.dehydrate({ response: createResponse({ id: 1, name: "Alice" }) })]} />,
      );
      const second = renderToString(
        <App client={client} data={[request.dehydrate({ response: createResponse({ id: 1, name: "Bob" }) })]} />,
      );
      const third = renderToString(<App client={client} data={[]} />);

      expect(first).toContain("Alice");
      expect(second).toContain("Bob");
      expect(second).not.toContain("Alice");
      expect(third).toContain("empty");
    });

    it("should render several keys and useSubmit from the same payload", () => {
      const client = new Client({ url: "http://localhost:3000", mode: "server" });
      const data = [1, 2, 3].map((userId) =>
        createRequest(client, userId).dehydrate({ response: createResponse({ id: userId, name: `User ${userId}` }) }),
      );
      const SubmitName = () => {
        const { data: submitData } = useSubmit(createRequest(client, 2));
        return <b>{submitData?.name}</b>;
      };

      const html = renderToString(
        <Hydrate client={client} data={data}>
          {[1, 2, 3].map((userId) => (
            <UserName key={userId} request={createRequest(client, userId)} />
          ))}
          <SubmitName />
        </Hydrate>,
      );

      expect(html).toContain("User 1");
      expect(html).toContain("User 2");
      expect(html).toContain("User 3");
      expect(html).toContain("<b>User 2</b>");
    });
  });

  describe("given server markup hydrated on the client", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.append(container);
    });

    afterEach(() => {
      container.remove();
    });

    const hydrate = async (element: React.ReactElement) => {
      const onRecoverableError = vi.fn();
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      await act(async () => {
        root = hydrateRoot(container, element, { onRecoverableError });
      });
      const errors = consoleError.mock.calls;
      consoleError.mockRestore();
      return { onRecoverableError, errors, unmount: () => act(() => root?.unmount()) };
    };

    it("should hydrate without a mismatch and without a request", async () => {
      const serverClient = new Client({ url: "http://localhost:3000", mode: "server" });
      const payload = toWire([
        createRequest(serverClient).dehydrate({ response: createResponse({ id: 1, name: "Round trip" }) }),
      ]);
      container.innerHTML = renderToString(<App client={serverClient} data={payload} />);

      const browserClient = new Client({ url: "http://localhost:3000" });
      const spy = vi.spyOn(browserClient.fetchDispatcher, "add");
      const { onRecoverableError, errors, unmount } = await hydrate(<App client={browserClient} data={payload} />);

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(errors).toHaveLength(0);
      expect(container.textContent).toBe("Round trip");
      expect(browserClient.cache.get(createRequest(browserClient).cacheKey)?.data).toEqual({
        id: 1,
        name: "Round trip",
      });
      expect(spy).not.toHaveBeenCalled();
      await unmount();
    });

    it("should hydrate without a mismatch when the browser cache holds older data", async () => {
      const serverClient = new Client({ url: "http://localhost:3000", mode: "server" });
      const now = Date.now();
      const payload = toWire([
        createRequest(serverClient).dehydrate({ response: createResponse({ id: 1, name: "Fresh" }, now) }),
      ]);
      container.innerHTML = renderToString(<App client={serverClient} data={payload} />);

      // e.g. restored from persistent storage
      const browserClient = new Client({ url: "http://localhost:3000" });
      const browserRequest = createRequest(browserClient);
      browserClient.cache.set(browserRequest, {
        ...createResponse({ id: 1, name: "Persisted" }, now - Time.MIN),
        retries: 0,
        isCanceled: false,
        isOffline: false,
        willRetry: false,
        addedTimestamp: now,
        triggerTimestamp: now,
      } as any);

      const { onRecoverableError, errors, unmount } = await hydrate(<App client={browserClient} data={payload} />);

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(errors).toHaveLength(0);
      expect(container.textContent).toBe("Fresh");
      expect(browserClient.cache.get(browserRequest.cacheKey)?.data).toEqual({ id: 1, name: "Fresh" });
      await unmount();
    });
  });
});
