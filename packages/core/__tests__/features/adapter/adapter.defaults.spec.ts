import { createHttpMockingServer } from "@hyper-fetch/testing";
import { getAdapterBindings, getErrorMessage } from "adapter";
import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

/** `adapter.setAdapterDefaults()` sets adapter options for every request; a request's own options win. */
describe("Adapter [ Defaults ]", () => {
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  const getOptions = async (client: Client, options?: Record<string, unknown>) => {
    const request = client.createRequest()({ endpoint: "/defaults", ...(options && { options }) });
    const { adapterOptions } = await getAdapterBindings({
      request,
      requestId: "defaults",
      resolve: () => null,
      onStartTime: () => null,
      internalErrorMapping: (error) => error,
    });
    return adapterOptions;
  };

  it("should apply the defaults to a request without options", async () => {
    const client = new Client({ url: "http://localhost:9000" });
    client.adapter.setAdapterDefaults(() => ({ timeout: 1234 }));

    expect(await getOptions(client)).toEqual({ timeout: 1234 });
  });

  it("should let the request options override the defaults", async () => {
    const client = new Client({ url: "http://localhost:9000" });
    client.adapter.setAdapterDefaults(() => ({ timeout: 1234, credentials: "include" }));

    expect(await getOptions(client, { timeout: 99 })).toEqual({ timeout: 99, credentials: "include" });
  });

  it("should pass the request to the defaults callback", async () => {
    const client = new Client({ url: "http://localhost:9000" });
    const callback = vi.fn(() => ({ timeout: 1 }));
    client.adapter.setAdapterDefaults(callback);

    await getOptions(client);

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/defaults" }));
  });

  it("should keep the request options untouched without defaults", async () => {
    const client = new Client({ url: "http://localhost:9000" });

    expect(await getOptions(client)).toBeUndefined();
    expect(await getOptions(client, { timeout: 5 })).toEqual({ timeout: 5 });
  });

  it("should make the fetch adapter use a default timeout", async () => {
    const client = new Client({ url: "http://localhost:9000" });
    client.adapter.setAdapterDefaults(() => ({ timeout: 20 }));
    const request = client.createRequest<{ response: { ok: boolean } }>()({ endpoint: "/slow" });
    mockRequest(request, { data: { ok: true }, delay: 300 });

    const response = await request.send();

    expect(response.error).toEqual(getErrorMessage("timeout"));
  });

  it("should still succeed when the request overrides a short default timeout", async () => {
    const client = new Client({ url: "http://localhost:9000" });
    client.adapter.setAdapterDefaults(() => ({ timeout: 20 }));
    const request = client
      .createRequest<{ response: { ok: boolean } }>()({ endpoint: "/slow" })
      .setOptions({ timeout: 5000 });
    mockRequest(request, { data: { ok: true }, delay: 100 });

    const response = await request.send();

    expect(response.data).toEqual({ ok: true });
  });
});
