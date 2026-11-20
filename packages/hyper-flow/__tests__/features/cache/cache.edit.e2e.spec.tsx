import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

type Profile = {
  name: string;
  age: number;
  active: boolean;
  address: { city: string };
  updatedAt: string;
};

const profile: Profile = {
  name: "Maciej",
  age: 30,
  active: true,
  address: { city: "Kraków" },
  // Named like a date, but not one
  updatedAt: "never",
};

describe("Cache [ Editing ]", () => {
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
    const getProfile = client.createRequest<{ response: Profile }>()({ endpoint: "/profile" });
    mockRequest(getProfile, { data: profile });
    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/cache");
    await getProfile.send();

    const key = await screen.findByText(getProfile.cacheKey);
    await view.user.click(key.closest("tr")!);
    await screen.findByText("/ Details", { exact: false });

    const getUserData = () => client.cache.get<Profile, unknown>(getProfile.cacheKey)?.data;
    return { client, getProfile, view, getUserData };
  };

  it("should open the details of an entry whose date-like keys hold other values", async () => {
    await setup();

    expect(screen.getByDisplayValue("never")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Maciej")).toBeInTheDocument();
  });

  it("should write an edited string into the user's cache", async () => {
    const { client, getProfile, getUserData } = await setup();
    const onData = vi.fn();
    client.cache.events.onDataByKey(getProfile.cacheKey, onData);

    fireEvent.change(screen.getByDisplayValue("Maciej"), { target: { value: "Kacper" } });

    await waitFor(() => expect(getUserData()?.name).toBe("Kacper"));
    expect(getUserData()).toStrictEqual({ ...profile, name: "Kacper" });
    expect(onData).toHaveBeenCalled();
  });

  it("should write edited numbers and booleans with their types", async () => {
    const { getUserData } = await setup();

    fireEvent.change(screen.getByRole("spinbutton", { name: "data.age" }), { target: { value: "31" } });
    await waitFor(() => expect(getUserData()?.age).toBe(31));

    fireEvent.click(screen.getByRole("checkbox", { name: "data.active" }));
    await waitFor(() => expect(getUserData()?.active).toBeFalse());
    expect(getUserData()?.age).toBe(31);
  });

  it("should write nested values", async () => {
    const { getUserData } = await setup();

    fireEvent.change(screen.getByRole("textbox", { name: "data.address.city" }), { target: { value: "Warsaw" } });

    await waitFor(() => expect(getUserData()?.address).toStrictEqual({ city: "Warsaw" }));
    expect(getUserData()?.name).toBe("Maciej");
  });

  it("should keep the edited data in HyperFlow and keep the entry fresh", async () => {
    const { client, getProfile } = await setup();

    fireEvent.change(screen.getByDisplayValue("Maciej"), { target: { value: "Kacper" } });

    expect(await screen.findByDisplayValue("Kacper")).toBeInTheDocument();
    await waitFor(() => expect(client.cache.get(getProfile.cacheKey)?.data).toMatchObject({ name: "Kacper" }));
    expect(client.cache.get(getProfile.cacheKey)?.cached).toBeTrue();
  });

  it("should edit timestamps with a date input and keep them numbers", async () => {
    const { getUserData, client, getProfile } = await setup();
    const input = screen.getByLabelText("responseTimestamp");
    expect(input).toHaveAttribute("type", "datetime-local");

    fireEvent.change(input, { target: { value: "2026-01-02T03:04:05" } });

    await waitFor(() =>
      expect(client.cache.get(getProfile.cacheKey)?.responseTimestamp).toBe(Date.UTC(2026, 0, 2, 3, 4, 5)),
    );
    expect(getUserData()).toStrictEqual(profile);
  });

  it("should show new data from the user's app in the open details", async () => {
    const { getProfile } = await setup();
    mockRequest(getProfile, { data: { ...profile, name: "Fresh" } });

    await getProfile.send();

    expect(await screen.findByDisplayValue("Fresh")).toBeInTheDocument();
  });
});
