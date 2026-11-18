import type { RequestInstance } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { QueueRequest } from "hooks/use-queue";
import { useQueue } from "hooks/use-queue";

import { createGatedClient } from "../../utils/gated-client.utils";

const setup = (options?: { queued?: boolean; retry?: number; retryTime?: number; offline?: boolean }) => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{ response: { id: number }; payload: { name: string } }>()({
    endpoint: "/items",
    method: "POST",
    queued: options?.queued ?? true,
    retry: options?.retry ?? 0,
    retryTime: options?.retryTime ?? 0,
    offline: options?.offline ?? true,
  });
  const dispatcher = gated.client.submitDispatcher;
  /** Adds the request to the dispatcher and returns its id */
  const add = (req: RequestInstance = request) => {
    let requestId = "";
    act(() => {
      requestId = dispatcher.add(req);
    });
    return requestId;
  };
  const getQueueIds = () => dispatcher.getQueue(request.queryKey).requests.map((item) => item.requestId);
  return { ...gated, request, dispatcher, add, getQueueIds };
};

const getIds = (requests: QueueRequest<RequestInstance>[]) => requests.map((item) => item.requestId);

const countListeners = (emitter: {
  eventNames: () => (string | symbol)[];
  listenerCount: (name: string | symbol) => number;
}) => emitter.eventNames().reduce((sum, name) => sum + emitter.listenerCount(name), 0);

describe("useQueue [ Controls ]", () => {
  describe("when the queue gets stopped", () => {
    it("should report the stopped status", () => {
      const { request } = setup();
      const { result } = renderHook(() => useQueue(request));

      act(() => {
        result.current.stop();
      });

      expect(result.current.stopped).toBeTrue();
    });
    it("should cancel the running request and keep it in the list", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      const requestId = add();
      const call = await waitForCall(0);

      act(() => {
        result.current.stop();
      });

      expect(call.aborted).toBeTrue();
      await waitFor(() => {
        expect(result.current.requests[0].canceled).toBeTrue();
      });
      expect(getIds(result.current.requests)).toStrictEqual([requestId]);
    });
    it("should not mark the canceled request as failed", async () => {
      const { request, add, waitForCall, dispatcher } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      await waitForCall(0);

      act(() => {
        result.current.stop();
      });
      // The canceled response went through the dispatcher
      await waitFor(() => {
        expect(dispatcher.getQueue(request.queryKey).requests[0].resolved).toBeTrue();
      });

      expect(result.current.requests[0].failed).toBeFalse();
      expect(result.current.requests[0].success).toBeFalse();
    });
    it("should not send the waiting requests", async () => {
      const { request, add, waitForCall, calls, getQueueIds } = setup();
      const { result } = renderHook(() => useQueue(request));
      const ids = [add(), add(), add()];
      await waitForCall(0);

      act(() => {
        result.current.stop();
      });
      await waitFor(() => {
        expect(result.current.requests[0].canceled).toBeTrue();
      });

      expect(calls).toHaveLength(1);
      expect(getQueueIds()).toStrictEqual(ids);
      expect(getIds(result.current.requests)).toStrictEqual(ids);
    });
    it("should keep new requests waiting while the queue is stopped", async () => {
      const { request, add, calls } = setup();
      const { result } = renderHook(() => useQueue(request));

      act(() => {
        result.current.stop();
      });
      const ids = [add(), add()];

      expect(getIds(result.current.requests)).toStrictEqual(ids);
      expect(result.current.stopped).toBeTrue();
      expect(calls).toHaveLength(0);
    });
    it("should follow a stop made directly on the dispatcher", () => {
      const { request, dispatcher } = setup();
      const { result } = renderHook(() => useQueue(request));

      act(() => {
        dispatcher.stop(request.queryKey);
      });

      expect(result.current.stopped).toBeTrue();
    });
  });

  describe("when the stopped queue gets started", () => {
    it("should report the running status", () => {
      const { request } = setup();
      const { result } = renderHook(() => useQueue(request));

      act(() => {
        result.current.stop();
      });
      act(() => {
        result.current.start();
      });

      expect(result.current.stopped).toBeFalse();
    });
    it("should send the canceled request again", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      const requestId = add();
      await waitForCall(0);
      act(() => {
        result.current.stop();
      });
      await waitFor(() => {
        expect(result.current.requests[0].canceled).toBeTrue();
      });

      act(() => {
        result.current.start();
      });

      const secondCall = await waitForCall(1);
      expect(secondCall.requestId).toBe(requestId);
    });
    it("should clear the canceled flag once the request runs again", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      await waitForCall(0);
      act(() => {
        result.current.stop();
      });
      await waitFor(() => {
        expect(result.current.requests[0].canceled).toBeTrue();
      });

      act(() => {
        result.current.start();
      });
      await waitForCall(1);

      await waitFor(() => {
        expect(result.current.requests[0].canceled).toBeFalse();
      });
    });
    it("should finish the restarted request and continue with the queue", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const second = add();
      await waitForCall(0);
      act(() => {
        result.current.stop();
      });
      await waitFor(() => {
        expect(result.current.requests[0].canceled).toBeTrue();
      });
      act(() => {
        result.current.start();
      });

      const restarted = await waitForCall(1);
      act(() => {
        restarted.succeed();
      });

      const next = await waitForCall(2);
      expect(next.requestId).toBe(second);
      await waitFor(() => {
        expect(getIds(result.current.requests)).toStrictEqual([second]);
      });
    });
    it("should send the requests queued while it was stopped", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      act(() => {
        result.current.stop();
      });
      const first = add();
      add();

      act(() => {
        result.current.start();
      });

      const call = await waitForCall(0);
      expect(call.requestId).toBe(first);
    });
  });

  describe("when the queue gets paused", () => {
    it("should report the stopped status", () => {
      const { request } = setup();
      const { result } = renderHook(() => useQueue(request));

      act(() => {
        result.current.pause();
      });

      expect(result.current.stopped).toBeTrue();
    });
    it("should let the running request finish", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const second = add();
      const call = await waitForCall(0);

      act(() => {
        result.current.pause();
      });
      expect(call.aborted).toBeFalse();

      act(() => {
        call.succeed();
      });

      await waitFor(() => {
        expect(getIds(result.current.requests)).toStrictEqual([second]);
      });
    });
    it("should not send the next request until the queue is started", async () => {
      const { request, add, waitForCall, calls } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const second = add();
      const call = await waitForCall(0);
      act(() => {
        result.current.pause();
      });
      act(() => {
        call.succeed();
      });
      await waitFor(() => {
        expect(getIds(result.current.requests)).toStrictEqual([second]);
      });
      expect(calls).toHaveLength(1);

      act(() => {
        result.current.start();
      });

      const nextCall = await waitForCall(1);
      expect(nextCall.requestId).toBe(second);
    });
    it("should not mark the running request as canceled", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      await waitForCall(0);

      act(() => {
        result.current.pause();
      });

      expect(result.current.requests[0].canceled).toBeFalse();
    });
  });

  describe("when a single request gets stopped", () => {
    it("should mark only that request as stopped", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      add();
      add();
      await waitForCall(0);

      act(() => {
        result.current.requests[1].stopRequest();
      });

      expect(result.current.requests.map((item) => item.stopped)).toStrictEqual([false, true, false]);
      expect(result.current.stopped).toBeFalse();
    });
    it("should cancel it when it is running", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const call = await waitForCall(0);

      act(() => {
        result.current.requests[0].stopRequest();
      });

      expect(call.aborted).toBeTrue();
      await waitFor(() => {
        expect(result.current.requests[0].canceled).toBeTrue();
      });
      expect(result.current.requests[0].stopped).toBeTrue();
    });
    it("should skip the stopped request and send the next one", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const second = add();
      const third = add();
      const firstCall = await waitForCall(0);

      act(() => {
        result.current.requests[1].stopRequest();
      });
      act(() => {
        firstCall.succeed();
      });

      const nextCall = await waitForCall(1);
      expect(nextCall.requestId).toBe(third);
      await waitFor(() => {
        expect(getIds(result.current.requests)).toStrictEqual([second, third]);
      });
    });
    it("should keep the stopped request in the list", async () => {
      const { request, add, waitForCall, getQueueIds } = setup();
      const { result } = renderHook(() => useQueue(request));
      const first = add();
      const second = add();
      await waitForCall(0);

      act(() => {
        result.current.requests[1].stopRequest();
      });

      expect(getIds(result.current.requests)).toStrictEqual([first, second]);
      expect(getQueueIds()).toStrictEqual([first, second]);
    });
  });

  describe("when a single stopped request gets started", () => {
    it("should clear its stopped status", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      add();
      await waitForCall(0);
      act(() => {
        result.current.requests[1].stopRequest();
      });

      act(() => {
        result.current.requests[1].startRequest();
      });

      expect(result.current.requests.map((item) => item.stopped)).toStrictEqual([false, false]);
    });
    it("should send it again when nothing else is running", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      const requestId = add();
      await waitForCall(0);
      act(() => {
        result.current.requests[0].stopRequest();
      });
      await waitFor(() => {
        expect(result.current.requests[0].canceled).toBeTrue();
      });

      act(() => {
        result.current.requests[0].startRequest();
      });

      const call = await waitForCall(1);
      expect(call.requestId).toBe(requestId);
      await waitFor(() => {
        expect(result.current.requests[0].canceled).toBeFalse();
      });
    });
  });

  describe("when a single request gets deleted", () => {
    it("should remove a waiting request without sending it", async () => {
      const { request, add, waitForCall, calls, getQueueIds } = setup();
      const { result } = renderHook(() => useQueue(request));
      const first = add();
      add();
      const call = await waitForCall(0);

      act(() => {
        result.current.requests[1].deleteRequest();
      });
      act(() => {
        call.succeed();
      });

      await waitFor(() => {
        expect(result.current.requests).toStrictEqual([]);
      });
      expect(getQueueIds()).toStrictEqual([]);
      expect(calls).toHaveLength(1);
      expect(first).toBeString();
    });
    it("should cancel the running request and start the next one", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const second = add();
      const call = await waitForCall(0);

      act(() => {
        result.current.requests[0].deleteRequest();
      });

      expect(call.aborted).toBeTrue();
      const nextCall = await waitForCall(1);
      expect(nextCall.requestId).toBe(second);
      expect(getIds(result.current.requests)).toStrictEqual([second]);
    });
    it("should resolve the send promise of the deleted request with an error", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      let promise: ReturnType<typeof request.send> | null = null;
      act(() => {
        promise = request.send({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);

      act(() => {
        result.current.requests[0].deleteRequest();
      });

      const response = await promise!;
      expect(response.success).toBeFalse();
      expect(response.data).toBeNull();
      expect(response.error).toBeInstanceOf(Error);
    });
    it("should delete from a stopped queue", () => {
      const { request, add, getQueueIds } = setup();
      const { result } = renderHook(() => useQueue(request));
      act(() => {
        result.current.stop();
      });
      add();
      const second = add();

      act(() => {
        result.current.requests[0].deleteRequest();
      });

      expect(getIds(result.current.requests)).toStrictEqual([second]);
      expect(getQueueIds()).toStrictEqual([second]);
    });
  });

  describe("when two hooks control the same queue", () => {
    it("should show the stopped status in both", () => {
      const { request } = setup();
      const first = renderHook(() => useQueue(request));
      const second = renderHook(() => useQueue(request));

      act(() => {
        first.result.current.stop();
      });

      expect(first.result.current.stopped).toBeTrue();
      expect(second.result.current.stopped).toBeTrue();
    });
    it("should let one hook start the queue stopped by the other", () => {
      const { request } = setup();
      const first = renderHook(() => useQueue(request));
      const second = renderHook(() => useQueue(request));

      act(() => {
        first.result.current.stop();
      });
      act(() => {
        second.result.current.start();
      });

      expect(first.result.current.stopped).toBeFalse();
      expect(second.result.current.stopped).toBeFalse();
    });
    it("should remove a request deleted by the other hook", async () => {
      const { request, add, waitForCall } = setup();
      const first = renderHook(() => useQueue(request));
      const second = renderHook(() => useQueue(request));
      const firstId = add();
      add();
      await waitForCall(0);

      act(() => {
        second.result.current.requests[1].deleteRequest();
      });

      expect(getIds(first.result.current.requests)).toStrictEqual([firstId]);
      expect(getIds(second.result.current.requests)).toStrictEqual([firstId]);
    });
    it("should show the single request stopped by the other hook", async () => {
      const { request, add, waitForCall } = setup();
      const first = renderHook(() => useQueue(request));
      const second = renderHook(() => useQueue(request));
      add();
      add();
      await waitForCall(0);

      act(() => {
        second.result.current.requests[1].stopRequest();
      });

      expect(first.result.current.requests[1].stopped).toBeTrue();
    });
  });

  describe("when the hook subscribes to events", () => {
    it("should remove every listener on unmount", () => {
      const { request, client } = setup();
      const requestListeners = countListeners(client.requestManager.emitter);
      const dispatcherListeners = countListeners(client.submitDispatcher.emitter);

      const view = renderHook(() => useQueue(request));
      expect(countListeners(client.requestManager.emitter)).toBeGreaterThan(requestListeners);
      expect(countListeners(client.submitDispatcher.emitter)).toBeGreaterThan(dispatcherListeners);

      view.unmount();

      expect(countListeners(client.requestManager.emitter)).toBe(requestListeners);
      expect(countListeners(client.submitDispatcher.emitter)).toBe(dispatcherListeners);
    });
    it("should not add listeners as the queue changes", async () => {
      const { request, client, dispatcher, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      const dispatcherListeners = countListeners(client.submitDispatcher.emitter);

      act(() => {
        result.current.pause();
      });
      const requestListeners = countListeners(client.requestManager.emitter);
      act(() => {
        for (let i = 0; i < 10; i += 1) {
          dispatcher.add(request);
        }
      });
      act(() => {
        result.current.requests[3].stopRequest();
        result.current.requests[5].deleteRequest();
      });

      expect(countListeners(client.requestManager.emitter)).toBe(requestListeners);
      expect(countListeners(client.submitDispatcher.emitter)).toBe(dispatcherListeners);
      expect(result.current.requests).toHaveLength(9);
      act(() => {
        result.current.start();
      });
      await waitForCall(0);
    });
    it("should remove the listeners of the previous queue when the request changes", () => {
      const { request, client } = setup();
      const otherRequest = client.createRequest()({ endpoint: "/other", method: "POST", queued: true });
      const view = renderHook(({ current }: { current: RequestInstance }) => useQueue(current), {
        initialProps: { current: request as RequestInstance },
      });
      const requestListeners = countListeners(client.requestManager.emitter);
      const dispatcherListeners = countListeners(client.submitDispatcher.emitter);

      view.rerender({ current: otherRequest });

      expect(countListeners(client.requestManager.emitter)).toBe(requestListeners);
      expect(countListeners(client.submitDispatcher.emitter)).toBe(dispatcherListeners);
    });
  });
});
