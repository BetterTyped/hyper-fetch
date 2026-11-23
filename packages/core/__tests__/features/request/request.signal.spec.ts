import { getErrorMessage } from "adapter";

import { createControlledClient, flushPromises, isPending } from "../../utils/controlled-adapter.utils";

/**
 * The `signal` of a call only triggers the abort controller HyperFetch keeps for that call, so the call ends the same
 * way `request.abort()` ends it - only without touching the other calls of the same abort key.
 */
describe("Request [ Signal ]", () => {
  const abortError = getErrorMessage("abort");

  const setup = (options?: { method?: "GET" | "POST" }) => {
    const { client, calls } = createControlledClient();
    const request = client.createRequest<{
      response: any;
      payload: any;
      error: any;
    }>()({
      endpoint: "/signal",
      method: options?.method ?? "POST",
    });

    return { client, calls, request };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe.each(["send", "exec"] as const)("When the signal is given to %s", (method) => {
    it("should abort the running call and give the abort error", async () => {
      const { request, calls } = setup();
      const controller = new AbortController();
      const onResponse = vi.fn();

      const sent = request[method]({ signal: controller.signal, onResponse });
      await flushPromises();
      controller.abort();
      const response = await sent;

      expect(calls[0].isAborted()).toBeTrue();
      expect(response.success).toBeFalse();
      expect(response.error).toStrictEqual(abortError);
      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ isCanceled: true }),
        }),
      );
    });

    it("should abort only its own call, not the others of the same abort key", async () => {
      const { request, calls } = setup();
      const controller = new AbortController();

      const aborted = request[method]({ signal: controller.signal });
      const other = request[method]();
      await flushPromises();
      expect(calls).toHaveLength(2);
      controller.abort();
      await flushPromises();
      await calls[1].succeed({ id: 1 });

      await expect(aborted).resolves.toHaveProperty("error", abortError);
      await expect(other).resolves.toHaveProperty("data", { id: 1 });
      expect(calls[1].isAborted()).toBeFalse();
    });

    it("should not send anything when the signal is aborted already", async () => {
      const { client, request, calls } = setup();
      const controller = new AbortController();
      controller.abort();

      const response = await request[method]({ signal: controller.signal });
      await flushPromises();

      expect(calls).toHaveLength(0);
      expect(response.error).toStrictEqual(abortError);
      expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(client.requestManager.abortControllers.size).toBe(0);
    });

    it("should stop listening to the signal once the call is settled", async () => {
      const { request, calls } = setup();
      const controller = new AbortController();
      const removeListener = vi.spyOn(controller.signal, "removeEventListener");

      const sent = request[method]({ signal: controller.signal });
      await flushPromises();
      await calls[0].succeed({ id: 1 });
      await sent;

      expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
    });

    it("should keep the response when the signal aborts after it", async () => {
      const { client, request, calls } = setup();
      const controller = new AbortController();

      const sent = request[method]({ signal: controller.signal });
      await flushPromises();
      await calls[0].succeed({ id: 1 });
      const response = await sent;
      controller.abort();
      await flushPromises();

      expect(response.data).toStrictEqual({ id: 1 });
      expect(client.requestManager.abortControllers.size).toBe(0);
    });

    it("should still be aborted by request.abort()", async () => {
      const { request } = setup();
      const controller = new AbortController();

      const sent = request[method]({ signal: controller.signal });
      await flushPromises();
      request.abort();

      await expect(sent).resolves.toHaveProperty("error", abortError);
    });
  });

  describe("When the signal is given to send", () => {
    it("should take a queued call out of the queue without sending it", async () => {
      const { client, request, calls } = setup();
      const queued = request.setQueued(true);
      const controller = new AbortController();
      const onRemove = vi.fn();

      const first = queued.send();
      const second = queued.send({ signal: controller.signal, onRemove });
      await flushPromises();
      expect(calls).toHaveLength(1);
      controller.abort();
      const response = await second;
      await calls[0].succeed({ id: 1 });

      expect(response.error).toStrictEqual(abortError);
      expect(onRemove).toHaveBeenCalledOnce();
      await expect(first).resolves.toHaveProperty("data", { id: 1 });
      await flushPromises();
      expect(calls).toHaveLength(1);
      expect(client.submitDispatcher.getQueue(queued.queryKey).requests).toHaveLength(0);
    });

    it("should not send the retry of a call that waits for it", async () => {
      const { request, calls } = setup();
      const controller = new AbortController();
      const onRetry = vi.fn();

      const sent = request.setRetry(1).setRetryTime(10_000).send({ signal: controller.signal, onRetry });
      await flushPromises();
      await calls[0].fail({ message: "Failed" });
      expect(onRetry).toHaveBeenCalledOnce();
      controller.abort();
      const response = await sent;
      await vi.advanceTimersByTimeAsync(10_000);

      expect(response.error).toStrictEqual(abortError);
      expect(calls).toHaveLength(1);
    });

    it("should only stop waiting for a deduplicated call and keep it for the others", async () => {
      const { request, calls } = setup({ method: "GET" });
      const deduplicated = request.setDeduplicate(true);
      const controller = new AbortController();

      const first = deduplicated.send();
      const joined = deduplicated.send({ signal: controller.signal });
      await flushPromises();
      expect(calls).toHaveLength(1);
      controller.abort();

      await expect(joined).resolves.toHaveProperty("error", abortError);
      expect(await isPending(first)).toBeTrue();
      expect(calls[0].isAborted()).toBeFalse();
      await calls[0].succeed({ id: 1 });
      await expect(first).resolves.toHaveProperty("data", { id: 1 });
    });

    it("should abort the call it joined when the deduplicated call is the one with the signal", async () => {
      const { request, calls } = setup({ method: "GET" });
      const deduplicated = request.setDeduplicate(true);
      const controller = new AbortController();

      const first = deduplicated.send({ signal: controller.signal });
      const joined = deduplicated.send();
      await flushPromises();
      controller.abort();

      // The signal belongs to the call which started the request - the joined ones share its outcome
      await expect(first).resolves.toHaveProperty("error", abortError);
      await expect(joined).resolves.toHaveProperty("error", abortError);
      expect(calls[0].isAborted()).toBeTrue();
    });

    it("should roll back the optimistic change with the abort reason", async () => {
      const { request, calls } = setup();
      const queued = request.setQueued(true);
      const controller = new AbortController();
      const rollback = vi.fn();

      const first = queued.send();
      const second = queued.send({
        signal: controller.signal,
        optimistic: () => ({ rollback }),
      });
      await flushPromises();
      controller.abort();
      await second;
      await calls[0].succeed();
      await first;

      expect(rollback).toHaveBeenCalledOnce();
      expect(rollback).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: "abort",
          response: expect.objectContaining({ error: abortError }),
        }),
      );
    });

    it("should not run the optimistic callback when the signal is aborted already", async () => {
      const { request } = setup();
      const controller = new AbortController();
      const optimisticCallback = vi.fn(() => ({}));
      controller.abort();

      await request.send({
        signal: controller.signal,
        optimistic: optimisticCallback,
      });

      expect(optimisticCallback).not.toHaveBeenCalled();
    });
  });
});
