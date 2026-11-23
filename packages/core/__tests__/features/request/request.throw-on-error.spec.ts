import { getErrorMessage } from "adapter";
import { Client } from "client";
import { createSdk } from "sdk";

import { createControlledClient, flushPromises } from "../../utils/controlled-adapter.utils";

/**
 * With `throwOnError` the call rejects with the error of a failed response - the contract of React Query, SWR and
 * other code which tells failures by a rejected promise. Without it requests resolve with every response.
 */
describe("Request [ throwOnError ]", () => {
  const setup = (client = createControlledClient()) => {
    const request = client.client.createRequest<{
      response: { id: number };
      error: { message: string };
    }>()({
      endpoint: "/throw",
    });

    return { ...client, request };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe.each(["send", "exec"] as const)("When it is used with %s", (method) => {
    it("should resolve with the error response by default", async () => {
      const { request, calls } = setup();

      const sent = request[method]();
      await flushPromises();
      await calls[0].fail({ message: "Failed" }, 400);

      await expect(sent).resolves.toMatchObject({
        success: false,
        error: { message: "Failed" },
        status: 400,
      });
    });

    it("should reject with the error when given to the call", async () => {
      const { request, calls } = setup();

      const sent = request[method]({ throwOnError: true });
      await flushPromises();
      await calls[0].fail({ message: "Failed" }, 400);

      await expect(sent).rejects.toStrictEqual({ message: "Failed" });
    });

    it("should resolve with the successful response the same way as without it", async () => {
      const { request, calls } = setup();

      const sent = request[method]({ throwOnError: true });
      await flushPromises();
      await calls[0].succeed({ id: 1 }, 200);

      await expect(sent).resolves.toMatchObject({
        success: true,
        data: { id: 1 },
        error: null,
        status: 200,
      });
    });

    it("should reject when it is set on the request", async () => {
      const { request, calls } = setup();

      const sent = request.setThrowOnError(true)[method]();
      await flushPromises();
      await calls[0].fail({ message: "Failed" });

      await expect(sent).rejects.toStrictEqual({ message: "Failed" });
    });

    it("should let the call override the value of the request", async () => {
      const { request, calls } = setup();

      const sent = request.setThrowOnError(true)[method]({ throwOnError: false });
      await flushPromises();
      await calls[0].fail({ message: "Failed" });

      await expect(sent).resolves.toHaveProperty("error", {
        message: "Failed",
      });
    });

    it("should reject when the client defaults of the adapter set it", async () => {
      const controlled = createControlledClient();
      controlled.client.adapter.setRequestDefaults(() => ({
        throwOnError: true,
      }));
      const { request, calls } = setup(controlled);

      const sent = request[method]();
      await flushPromises();
      await calls[0].fail({ message: "Failed" });

      await expect(sent).rejects.toStrictEqual({ message: "Failed" });
    });

    it("should reject with the abort error of an aborted call", async () => {
      const { request } = setup();
      const controller = new AbortController();

      const sent = request[method]({
        throwOnError: true,
        signal: controller.signal,
      });
      await flushPromises();
      controller.abort();

      await expect(sent).rejects.toStrictEqual(getErrorMessage("abort"));
    });

    it("should decide by the mapped response", async () => {
      const { request, calls } = setup();
      const mapped = request.setResponseMapper((response) => ({
        ...response,
        data: null,
        error: { message: "Mapped" },
        success: false as const,
      }));

      const sent = mapped[method]({ throwOnError: true });
      await flushPromises();
      await calls[0].succeed({ id: 1 });

      await expect(sent).rejects.toStrictEqual({ message: "Mapped" });
    });
  });

  describe("When it is used with send", () => {
    it("should resolve with the cached response of cache-first", async () => {
      const { request, calls } = setup();
      const first = request.send();
      await flushPromises();
      await calls[0].succeed({ id: 1 });
      await first;

      const response = await request.send({
        throwOnError: true,
        cachePolicy: "cache-first",
      });

      expect(response.data).toStrictEqual({ id: 1 });
      expect(calls).toHaveLength(1);
    });

    it("should not reject the background revalidation of a cached response", async () => {
      const { request, calls } = setup();
      const first = request.send();
      await flushPromises();
      await calls[0].succeed({ id: 1 });
      await first;
      const unhandled = vi.fn();
      process.on("unhandledRejection", unhandled);

      const response = await request.send({
        throwOnError: true,
        cachePolicy: "revalidate",
      });
      await flushPromises();
      await calls[1].fail({ message: "Failed" });
      await flushPromises();
      process.off("unhandledRejection", unhandled);

      expect(response.data).toStrictEqual({ id: 1 });
      expect(unhandled).not.toHaveBeenCalled();
    });
  });

  describe("When the request is configured", () => {
    it("should be false by default", () => {
      const { request } = setup();

      expect(request.throwOnError).toBeFalse();
    });

    it("should take the value from createRequest", () => {
      const client = new Client({ url: "http://localhost" });
      const request = client.createRequest()({
        endpoint: "/users",
        throwOnError: true,
      });

      expect(request.throwOnError).toBeTrue();
    });

    it("should keep the value in clones and serialized requests", () => {
      const { client, request } = setup();
      const configured = request.setThrowOnError(true);

      expect(configured.clone().throwOnError).toBeTrue();
      expect(configured.toJSON().throwOnError).toBeTrue();
      expect(client.createRequest()({ endpoint: "/other" }).throwOnError).toBeFalse();
      expect(request.throwOnError).toBeFalse();
    });

    it("should be set by the sdk configuration", () => {
      const { client } = setup();
      const sdk = createSdk<
        typeof client,
        {
          users: {
            $get: ReturnType<ReturnType<typeof client.createRequest<{ response: { id: number } }>>>;
          };
        }
      >(client).$configure({ "users.$get": { throwOnError: true } });

      expect(sdk.users.$get.throwOnError).toBeTrue();
    });
  });
});
