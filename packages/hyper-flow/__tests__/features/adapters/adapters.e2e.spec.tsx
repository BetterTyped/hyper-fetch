import { AxiosAdapter } from "@hyper-fetch/axios";
import type { ClientInstance } from "@hyper-fetch/core";
import { Adapter, createClient } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";
import { createGraphqlMockingServer, createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";
import gql from "graphql-tag";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useApplications } from "@/store/applications/apps.store";
import { useCacheStore } from "@/store/applications/cache.store";
import { useConnectionStore } from "@/store/applications/connection.store";
import { useErrorStatsStore } from "@/store/applications/error-stats.store";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { useNetworkStore } from "@/store/applications/network.store";

const http = createHttpMockingServer();
const graphql = createGraphqlMockingServer();

const getRequests = () => useNetworkStore.getState().applications.App?.requests ?? [];
const getFinished = () => getRequests().filter((item) => item.isFinished);

describe("Adapters [ E2E ]", () => {
  const env = createHyperFlowEnv();

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
  });

  const connect = async <Client extends ClientInstance>(client: Client) => {
    const { plugin } = env.connectApp({ client });
    const view = env.renderApp();
    await env.waitForApp(plugin);
    return view;
  };

  describe("given the axios adapter", () => {
    beforeAll(() => http.startServer());
    afterAll(() => http.stopServer());
    beforeEach(() => http.resetMocks());

    const setup = () => {
      const client = createClient({ url: "http://localhost:5000" }).setAdapter(AxiosAdapter);
      const getUsers = client.createRequest<{ response: { id: number }[]; error: { message: string } }>()({
        endpoint: "/users",
      });
      const createUser = client.createRequest<{
        response: { id: number };
        payload: { name: string };
        error: { message: string };
      }>()({
        endpoint: "/users",
        method: "POST",
      });
      return { client, getUsers, createUser };
    };

    it("should present the application with the axios adapter", async () => {
      const { client } = setup();
      await connect(client);

      expect(useApplications.getState().applications.App.adapterName).toBe("axios-adapter");
      expect(useConnectionStore.getState().connections.App.client.adapter.name).toBe("axios-adapter");
    });

    it("should list successful and failed axios requests with their responses", async () => {
      const { client, getUsers, createUser } = setup();
      const view = await connect(client);
      http.mockRequest(getUsers, { data: [{ id: 1 }] });
      http.mockRequest(createUser, { status: 400, error: { message: "Invalid name" } });

      await getUsers.send();
      const userResponse = await createUser.send({ payload: { name: "" } });

      await waitFor(() => expect(getFinished()).toHaveLength(2));
      const [failed, succeeded] = getRequests();
      expect(succeeded).toMatchObject({ isSuccess: true, response: { data: [{ id: 1 }], status: 200 } });
      // HyperFlow shows the error exactly as the user's client received it (axios wraps the body in AxiosError)
      expect(failed).toMatchObject({
        isSuccess: false,
        // oxlint-disable-next-line unicorn/prefer-structured-clone
        response: { status: 400, error: JSON.parse(JSON.stringify(userResponse.error)) },
      });

      await view.navigate("/applications/App/network");
      const rows = await screen.findAllByText("/users");
      expect(rows).toHaveLength(2);
      expect(within(rows[0].closest("tr")!).getByText("POST")).toBeInTheDocument();
    });

    it("should collect statistics for axios requests", async () => {
      const { client, getUsers, createUser } = setup();
      await connect(client);
      http.mockRequest(getUsers, { data: [] });
      http.mockRequest(createUser, { status: 500, error: { message: "Down" } });

      await getUsers.send();
      await createUser.send({ payload: { name: "abc" } });

      await waitFor(() => {
        const { networkStats, networkEntries } = useNetworkStatsStore.getState().applications.App;
        expect(networkStats).toMatchObject({ totalRequests: 2, totalRequestsSuccess: 1, totalRequestsFailed: 1 });
        expect([...networkEntries.keys()].toSorted()).toStrictEqual(["GET-/users", "POST-/users"]);
      });
      expect(useErrorStatsStore.getState().applications.App.statusErrorStats.get(500)?.count).toBe(1);
    });

    it("should list cached axios responses", async () => {
      const { client, getUsers } = setup();
      await connect(client);
      http.mockRequest(getUsers, { data: [{ id: 7 }] });

      await getUsers.send();

      await waitFor(() => {
        expect(useCacheStore.getState().applications.App.caches.get(getUsers.cacheKey)?.cacheData.data).toStrictEqual([
          { id: 7 },
        ]);
      });
    });
  });

  describe("given the graphql adapter", () => {
    beforeAll(() => graphql.startServer());
    afterAll(() => graphql.stopServer());
    beforeEach(() => graphql.resetMocks());

    const getUserQuery = gql`
      query GetUser {
        user {
          id
          name
        }
      }
    `;
    // Typed as plain string, a literal endpoint type would make core look for route params in it
    const loginMutation = String.raw`
      mutation Login($email: String!) {
        login(email: $email) {
          token
        }
      }
    `;

    const setup = () => {
      const client = createClient({ url: "http://localhost:5000/graphql" }).setAdapter(GraphqlAdapter());
      const getUser = client.createRequest<{
        response: { user: { id: number; name: string } };
        error: { message: string };
      }>()({
        endpoint: getUserQuery,
      });
      const login = client.createRequest<{
        response: { login: { token: string } };
        payload: { email: string };
      }>()({ endpoint: loginMutation });
      return { client, getUser, login };
    };

    it("should present the application with the graphql adapter", async () => {
      const { client } = setup();
      await connect(client);

      expect(useApplications.getState().applications.App.adapterName).toBe("graphql");
    });

    it("should name graphql requests by their operation in the network list", async () => {
      const { client, getUser, login } = setup();
      const view = await connect(client);
      graphql.mockRequest(getUser, { data: { user: { id: 1, name: "Maciej" } } });
      graphql.mockRequest(login, { data: { login: { token: "abc" } } });

      await getUser.send();
      await login.send({ payload: { email: "test@example.com" } });
      await waitFor(() => expect(getFinished()).toHaveLength(2));

      await view.navigate("/applications/App/network");
      expect(await screen.findByText("GetUser")).toBeInTheDocument();
      expect(screen.getByText("Login")).toBeInTheDocument();
    });

    it("should find graphql requests by their operation name", async () => {
      const { client, getUser, login } = setup();
      const view = await connect(client);
      graphql.mockRequest(getUser, { data: { user: { id: 1, name: "Maciej" } } });
      graphql.mockRequest(login, { data: { login: { token: "abc" } } });
      await getUser.send();
      await login.send({ payload: { email: "test@example.com" } });
      await waitFor(() => expect(getFinished()).toHaveLength(2));
      await view.navigate("/applications/App/network");

      await view.user.type(await screen.findByRole("searchbox", { name: "Search requests" }), "GetUser");

      await waitFor(() => expect(screen.queryByText("Login")).not.toBeInTheDocument());
      expect(screen.getByText("GetUser")).toBeInTheDocument();
    });

    it("should group graphql statistics by operation instead of the whole document", async () => {
      const { client, getUser, login } = setup();
      await connect(client);
      graphql.mockRequest(getUser, { data: { user: { id: 1, name: "Maciej" } } });
      graphql.mockRequest(login, { data: { login: { token: "abc" } } });

      await getUser.send();
      await getUser.send();
      await login.send({ payload: { email: "test@example.com" } });

      await waitFor(() => {
        const { networkEntries } = useNetworkStatsStore.getState().applications.App;
        expect([...networkEntries.keys()].toSorted()).toStrictEqual(["POST-GetUser", "POST-Login"]);
        expect(networkEntries.get("POST-GetUser")?.stats.totalRequests).toBe(2);
      });
    });

    it("should list graphql errors as failed requests", async () => {
      const { client, getUser } = setup();
      await connect(client);
      graphql.mockRequest(getUser, { status: 400, error: { message: "Unauthorized" } });

      const { success } = await getUser.send();

      expect(success).toBeFalse();
      await waitFor(() => {
        expect(getFinished()).toHaveLength(1);
        expect(getFinished()[0].isSuccess).toBeFalse();
      });
    });

    it("should open the details of a graphql request", async () => {
      const { client, getUser } = setup();
      const view = await connect(client);
      graphql.mockRequest(getUser, { data: { user: { id: 1, name: "Maciej" } } });
      await getUser.send();
      await waitFor(() => expect(getFinished()).toHaveLength(1));

      await view.navigate("/applications/App/network");
      await view.user.click(await screen.findByText("GetUser"));

      expect(await screen.findByText("/ Details", { exact: false })).toBeInTheDocument();
    });
  });

  describe("given a non-http adapter", () => {
    // Firebase-like: method names instead of HTTP verbs and text statuses
    const createDocumentAdapter = () =>
      new Adapter<Record<string, never>, "getDoc" | "setDoc", "success" | "error", { snapshot: boolean }>({
        name: "documents",
        defaultMethod: "getDoc",
        defaultExtra: { snapshot: false },
        systemErrorStatus: "error",
        systemErrorExtra: { snapshot: false },
      }).setFetcher(({ request, onSuccess, onError }) => {
        if (request.endpoint.includes("missing")) {
          onError({ error: { code: "not-found" }, status: "error", extra: { snapshot: true } });
          return;
        }
        onSuccess({ data: { path: request.endpoint }, status: "success", extra: { snapshot: true } });
      });

    it("should present requests of an adapter with custom methods and statuses", async () => {
      const client = createClient({ url: "documents://" }).setAdapter(createDocumentAdapter());
      const getUser = client.createRequest<{ response: { path: string } }>()({ endpoint: "users/1" });
      const getMissing = client.createRequest<{ response: { path: string } }>()({ endpoint: "users/missing" });
      const view = await connect(client);

      await getUser.send();
      await getMissing.send();

      await waitFor(() => expect(getFinished()).toHaveLength(2));
      expect(useApplications.getState().applications.App.adapterName).toBe("documents");
      const [missing, found] = getRequests();
      expect(found).toMatchObject({ isSuccess: true, response: { status: "success", data: { path: "users/1" } } });
      expect(missing).toMatchObject({ isSuccess: false, response: { status: "error", error: { code: "not-found" } } });
      expect(useErrorStatsStore.getState().applications.App.statusErrorStats.get("error")?.count).toBe(1);
      expect([...useNetworkStatsStore.getState().applications.App.networkEntries.keys()].toSorted()).toStrictEqual([
        "getDoc-users/1",
        "getDoc-users/missing",
      ]);

      await view.navigate("/applications/App/network");
      const row = await screen.findByText("users/1");
      expect(within(row.closest("tr")!).getByText("getDoc")).toBeInTheDocument();
    });
  });
});
