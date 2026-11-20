import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useNetworkStore } from "@/store/applications/network.store";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

/** Endpoints of the listed rows, top to bottom. */
const getEndpoints = () =>
  screen
    .queryAllByRole("row")
    .slice(1)
    .map((row) => within(row).queryAllByText(/^\//)[0]?.textContent);

describe("Network [ List and details ]", () => {
  const env = createHyperFlowEnv();

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(async () => {
    resetMocks();
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
  });

  const setup = async () => {
    const client = createClient({ url: "http://localhost:5000" });
    const { plugin } = env.connectApp({ client });
    const getUsers = client.createRequest<{ response: { id: number }[]; error: { message: string } }>()({
      endpoint: "/users",
    });
    const getUser = client.createRequest<{ response: { id: number } }>()({ endpoint: "/users/:id" });
    const getPosts = client.createRequest<{ response: { id: number }[] }>()({ endpoint: "/posts", cache: false });

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/network");

    return { client, getUsers, getUser, getPosts, view };
  };

  type View = Awaited<ReturnType<typeof setup>>["view"];

  const waitForFinished = (count: number) =>
    waitFor(() => {
      expect(useNetworkStore.getState().applications.App.requests.filter((item) => item.isFinished)).toHaveLength(
        count,
      );
    });

  const filterBy = async (view: View, label: string) => {
    const filters = await screen.findByRole("group", { name: "Filter by status" });
    await view.user.click(within(filters).getByRole("button", { name: label }));
  };

  const openDetails = async (view: View, endpoint: string) => {
    await view.user.click(await screen.findByText(endpoint));
    expect(await screen.findByText("/ Details", { exact: false })).toBeInTheDocument();
  };

  const getOverviewValue = (label: string) => screen.getByText(label).closest("tr")!.querySelectorAll("td")[1];

  describe("When filtering by status", () => {
    it("should show only requests still in flight", async () => {
      const { getUsers, getPosts, view } = await setup();
      mockRequest(getPosts, { data: [] });
      mockRequest(getUsers, { data: [], delay: 400 });
      await getPosts.send();
      const promise = getUsers.send();
      await waitFor(() => expect(getEndpoints()).toHaveLength(2));

      await filterBy(view, "In progress");

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users"]));
      await promise;
      expect(await screen.findByText("No matching requests")).toBeInTheDocument();
    });

    it("should show only canceled requests", async () => {
      const { client, getUsers, getPosts, view } = await setup();
      mockRequest(getPosts, { data: [] });
      mockRequest(getUsers, { data: [], delay: 1000 });
      const unmount = client.requestManager.events.onRequestStart(() => {
        unmount();
        getUsers.abort();
      });
      await getUsers.send();
      await getPosts.send();
      await waitForFinished(1);

      await filterBy(view, "Canceled");

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users"]));
    });

    it("should show only requests removed from their queue", async () => {
      const { client, getUsers, getPosts, view } = await setup();
      mockRequest(getPosts, { data: [] });
      client.fetchDispatcher.stop(getUsers.queryKey);
      void getUsers.send();
      await waitFor(() => expect(client.fetchDispatcher.getQueue(getUsers.queryKey).requests).toHaveLength(1));
      const [queued] = client.fetchDispatcher.getQueue(getUsers.queryKey).requests;
      client.fetchDispatcher.delete(getUsers.queryKey, queued.requestId, getUsers.abortKey);
      await getPosts.send();
      await waitForFinished(1);

      await filterBy(view, "Removed");

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users"]));
    });
  });

  describe("When sorting", () => {
    const sendThree = async ({ getUsers, getUser, getPosts }: Awaited<ReturnType<typeof setup>>) => {
      mockRequest(getUsers, { data: [] });
      mockRequest(getUser, { data: { id: 1 } });
      mockRequest(getPosts, { data: [] });
      await getUser.send({ params: { id: 1 } });
      await getPosts.send();
      await getUsers.send();
      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users", "/posts", "/users/1"]));
    };

    it("should cycle the endpoint column through ascending, descending and the default order", async () => {
      const requests = await setup();
      await sendThree(requests);
      const header = screen.getByRole("button", { name: "Endpoint" });

      await requests.view.user.click(header);
      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/posts", "/users", "/users/1"]));

      await requests.view.user.click(header);
      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users/1", "/users", "/posts"]));

      await requests.view.user.click(header);
      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users", "/posts", "/users/1"]));
    });

    it("should sort by the time the requests were sent", async () => {
      const requests = await setup();
      await sendThree(requests);

      await requests.view.user.click(screen.getByRole("button", { name: "Timestamp" }));

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users/1", "/posts", "/users"]));
    });

    it("should sort by cache usage and keep the order of requests that use it alike", async () => {
      const requests = await setup();
      await sendThree(requests);

      await requests.view.user.click(screen.getByRole("button", { name: "Cache" }));

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/posts", "/users", "/users/1"]));
    });

    it("should switch the sorted column instead of combining columns", async () => {
      const requests = await setup();
      await sendThree(requests);

      await requests.view.user.click(screen.getByRole("button", { name: "Endpoint" }));
      await requests.view.user.click(screen.getByRole("button", { name: "Timestamp" }));

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/users/1", "/posts", "/users"]));
      // The endpoint column no longer drives the order, so one click on it sorts ascending again
      await requests.view.user.click(screen.getByRole("button", { name: "Endpoint" }));
      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/posts", "/users", "/users/1"]));
    });
  });

  describe("When inspecting a request", () => {
    it("should show unknown code and date and no response until the request finishes", async () => {
      const { client, getUsers, view } = await setup();
      mockRequest(getUsers, { data: [{ id: 1 }] });
      // A stopped queue holds the request back, so it stays without a response for as long as the test needs
      client.fetchDispatcher.stop(getUsers.queryKey);
      const promise = getUsers.send();
      await openDetails(view, "/users");

      expect(getOverviewValue("Code:")).toHaveTextContent("Unknown");
      expect(getOverviewValue("Response Date:")).toHaveTextContent("Unknown");
      await view.user.click(screen.getByRole("tab", { name: "Response" }));
      expect(screen.getByText("No response")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Show Less" })).not.toBeInTheDocument();
      await view.user.click(screen.getByRole("tab", { name: "Processing Details" }));
      expect(screen.getByText("No processing details")).toBeInTheDocument();

      client.fetchDispatcher.start(getUsers.queryKey);
      await promise;

      await waitFor(() => {
        expect(getOverviewValue("Code:")).toHaveTextContent("200");
      });
      expect(screen.queryByText("No processing details")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Show Less" })).toBeInTheDocument();
    });

    it("should show the response and the request configuration", async () => {
      const { getUsers, view } = await setup();
      mockRequest(getUsers, { data: [{ id: 1 }] });
      await getUsers.send();
      await openDetails(view, "/users");

      await view.user.click(screen.getByRole("tab", { name: "Response" }));
      expect(screen.getByRole("tabpanel")).toHaveTextContent("data");
      await view.user.click(screen.getByRole("button", { name: "Show Less" }));
      expect(screen.getByRole("button", { name: "Show More" })).toBeInTheDocument();

      await view.user.click(screen.getByRole("tab", { name: "Request Details" }));
      expect(screen.getByRole("tabpanel")).toHaveTextContent("endpoint");
      expect(screen.getByRole("tabpanel")).not.toHaveTextContent("queryParams");
    });

    it("should show the code of a failed request and how many times it was retried", async () => {
      const { getUsers, view } = await setup();
      mockRequest(getUsers, { status: 500, error: { message: "Boom" } });
      await getUsers.setRetry(1).setRetryTime(10).send();
      await waitForFinished(1);
      await openDetails(view, "/users");

      expect(getOverviewValue("Code:")).toHaveTextContent("500");
      expect(screen.getByText("Retried Request (1)")).toBeInTheDocument();
    });

    it("should remove the request from the list", async () => {
      const { getUsers, getPosts, view } = await setup();
      mockRequest(getUsers, { data: [] });
      mockRequest(getPosts, { data: [] });
      await getUsers.send();
      await getPosts.send();
      await waitForFinished(2);
      await openDetails(view, "/users");

      await view.user.click(screen.getByRole("button", { name: /Actions/ }));
      await view.user.click(await screen.findByRole("menuitem", { name: /Remove/ }));

      await waitFor(() => expect(getEndpoints()).toStrictEqual(["/posts"]));
      expect(screen.queryByText("/ Details", { exact: false })).not.toBeInTheDocument();
    });

    it("should close the details", async () => {
      const { getUsers, view } = await setup();
      mockRequest(getUsers, { data: [] });
      await getUsers.send();
      await openDetails(view, "/users");

      const toolbar = screen.getByText("/ Details", { exact: false }).parentElement!;
      await view.user.click(within(toolbar).getAllByRole("button")[0]);

      await waitFor(() => {
        expect(screen.queryByText("/ Details", { exact: false })).not.toBeInTheDocument();
      });
      expect(getEndpoints()).toStrictEqual(["/users"]);
    });
  });
});
