import type { RequestInstance } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { QueueRequest } from "hooks/use-queue";
import { useQueue } from "hooks/use-queue";
import { Provider } from "provider";
import type { ReactNode } from "react";
import { StrictMode } from "react";

import { createGatedClient } from "../../utils/gated-client.utils";

const setup = (options?: { queued?: boolean; method?: "POST" | "GET"; endpoint?: string }) => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{ response: { id: number }; payload: { name: string } }>()({
    endpoint: options?.endpoint ?? "/items",
    method: options?.method ?? "POST",
    queued: options?.queued ?? true,
  });
  const dispatcher = options?.method === "GET" ? gated.client.fetchDispatcher : gated.client.submitDispatcher;
  /** Adds the request to the dispatcher and returns its id */
  const add = (req: RequestInstance = request) => {
    let requestId = "";
    act(() => {
      requestId = dispatcher.add(req);
    });
    return requestId;
  };
  return { ...gated, request, dispatcher, add };
};

const getIds = (requests: QueueRequest<RequestInstance>[]) => requests.map((item) => item.requestId);

describe("useQueue [ List ]", () => {
  describe("given the queue is empty", () => {
    it("should start with an empty list and a running queue", () => {
      const { request } = setup();
      const { result } = renderHook(() => useQueue(request));

      expect(result.current.requests).toStrictEqual([]);
      expect(result.current.stopped).toBeFalse();
    });
    it("should expose the dispatcher that handles the request", () => {
      const { request, client } = setup();
      const { result } = renderHook(() => useQueue(request));

      expect(result.current.dispatcher).toBe(client.submitDispatcher);
    });
    it("should add the request to the list once it is queued", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));

      const requestId = add();
      await waitForCall(0);

      expect(getIds(result.current.requests)).toStrictEqual([requestId]);
    });
    it("should describe a freshly queued request", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));

      const requestId = add(request.setPayload({ name: "Maciej" }));
      await waitForCall(0);

      const [item] = result.current.requests;
      expect(item.requestId).toBe(requestId);
      expect(item.request.payload).toStrictEqual({ name: "Maciej" });
      expect(item.stopped).toBeFalse();
      expect(item.retries).toBe(0);
      expect(item.success).toBeFalse();
      expect(item.failed).toBeFalse();
      expect(item.canceled).toBeFalse();
      expect(item.removed).toBeFalse();
      expect(item.timestamp).toBeNumber();
      expect(item.startRequest).toBeFunction();
      expect(item.stopRequest).toBeFunction();
      expect(item.deleteRequest).toBeFunction();
    });
  });

  describe("given requests are already queued before the hook mounts", () => {
    it("should list them on the very first render", () => {
      const { request, dispatcher } = setup();
      dispatcher.stop(request.queryKey);
      const first = dispatcher.add(request);
      const second = dispatcher.add(request);
      const renders: string[][] = [];

      renderHook(() => {
        const queue = useQueue(request);
        renders.push(getIds(queue.requests));
        return queue;
      });

      expect(renders[0]).toStrictEqual([first, second]);
    });
    it("should read the stopped status on the very first render", () => {
      const { request, dispatcher } = setup();
      dispatcher.stop(request.queryKey);
      const renders: boolean[] = [];

      renderHook(() => {
        const queue = useQueue(request);
        renders.push(queue.stopped);
        return queue;
      });

      expect(renders[0]).toBeTrue();
    });
    it("should list the running request and the waiting ones", async () => {
      const { request, dispatcher, waitForCall } = setup();
      const first = dispatcher.add(request);
      const second = dispatcher.add(request);
      const third = dispatcher.add(request);
      await waitForCall(0);

      const { result } = renderHook(() => useQueue(request));

      expect(getIds(result.current.requests)).toStrictEqual([first, second, third]);
    });
  });

  describe("given several requests are queued one after another", () => {
    it("should keep the earlier requests when another one is added", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));

      const first = add();
      await waitForCall(0);
      const second = add();

      expect(getIds(result.current.requests)).toStrictEqual([first, second]);
    });
    it("should list every queued request in the order it was added", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));

      const first = add();
      await waitForCall(0);
      const second = add();
      const third = add();
      const fourth = add();

      expect(getIds(result.current.requests)).toStrictEqual([first, second, third, fourth]);
    });
    it("should list requests added in a single batch", async () => {
      const { request, dispatcher, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      const ids: string[] = [];

      act(() => {
        ids.push(dispatcher.add(request), dispatcher.add(request), dispatcher.add(request));
      });
      await waitForCall(0);

      expect(getIds(result.current.requests)).toStrictEqual(ids);
    });
    it("should mirror the dispatcher queue after every change", async () => {
      const { request, dispatcher, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));

      for (let i = 0; i < 6; i += 1) {
        add();
        const queueIds = dispatcher.getQueue(request.queryKey).requests.map((item) => item.requestId);
        expect(getIds(result.current.requests)).toStrictEqual(queueIds);
      }
      await waitForCall(0);
    });
    it("should remove only the finished request and keep the rest in order", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));

      add();
      const firstCall = await waitForCall(0);
      const second = add();
      const third = add();

      act(() => {
        firstCall.succeed();
      });

      await waitFor(() => {
        expect(getIds(result.current.requests)).toStrictEqual([second, third]);
      });
    });
    it("should drain the list one by one as the queued requests finish", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));

      const ids = [add(), add(), add()];

      for (let index = 0; index < ids.length; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        const call = await waitForCall(index);
        expect(call.requestId).toBe(ids[index]);
        expect(getIds(result.current.requests)).toStrictEqual(ids.slice(index));
        act(() => {
          call.succeed();
        });
        // eslint-disable-next-line no-await-in-loop
        await waitFor(() => {
          expect(getIds(result.current.requests)).toStrictEqual(ids.slice(index + 1));
        });
      }

      expect(result.current.requests).toStrictEqual([]);
    });
    it("should remove a failed request and continue with the next one", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));

      add();
      const second = add();
      const firstCall = await waitForCall(0);

      act(() => {
        firstCall.fail();
      });

      const secondCall = await waitForCall(1);
      expect(secondCall.requestId).toBe(second);
      await waitFor(() => {
        expect(getIds(result.current.requests)).toStrictEqual([second]);
      });
    });
    it("should keep the list in order when a waiting request is deleted from the middle", async () => {
      const { request, add, waitForCall, calls } = setup();
      const { result } = renderHook(() => useQueue(request));

      const first = add();
      await waitForCall(0);
      add();
      const third = add();

      act(() => {
        result.current.requests[1].deleteRequest();
      });

      expect(getIds(result.current.requests)).toStrictEqual([first, third]);
      expect(calls).toHaveLength(1);
    });
    it("should handle a long queue", async () => {
      const { request, dispatcher, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      const ids: string[] = [];

      act(() => {
        for (let i = 0; i < 100; i += 1) {
          ids.push(dispatcher.add(request));
        }
      });
      const firstCall = await waitForCall(0);

      expect(getIds(result.current.requests)).toStrictEqual(ids);

      act(() => {
        firstCall.succeed();
      });

      await waitFor(() => {
        expect(getIds(result.current.requests)).toStrictEqual(ids.slice(1));
      });
    });
    it("should give every item its own unique request id", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));

      add();
      add();
      add();
      await waitForCall(0);

      expect(new Set(getIds(result.current.requests)).size).toBe(3);
    });
  });

  describe("given requests are sent all at once", () => {
    it("should list every running request", async () => {
      const { request, add, waitForCalls } = setup({ queued: false });
      const { result } = renderHook(() => useQueue(request));

      const ids = [add(), add(), add()];
      await waitForCalls(3);

      expect(getIds(result.current.requests)).toStrictEqual(ids);
    });
    it("should remove the requests in the order they finish", async () => {
      const { request, add, waitForCalls } = setup({ queued: false });
      const { result } = renderHook(() => useQueue(request));

      const [first, second, third] = [add(), add(), add()];
      const calls = await waitForCalls(3);

      act(() => {
        calls[1].succeed();
      });
      await waitFor(() => {
        expect(getIds(result.current.requests)).toStrictEqual([first, third]);
      });

      act(() => {
        calls[2].succeed();
      });
      await waitFor(() => {
        expect(getIds(result.current.requests)).toStrictEqual([first]);
      });
      expect(second).toBeString();
    });
  });

  describe("given requests of other queues exist", () => {
    it("should not list requests with a different query key", async () => {
      const { request, client, add, waitForCalls } = setup();
      const otherRequest = client.createRequest()({ endpoint: "/other", method: "POST", queued: true });
      const { result } = renderHook(() => useQueue(request));

      const requestId = add();
      add(otherRequest);
      await waitForCalls(2);

      expect(getIds(result.current.requests)).toStrictEqual([requestId]);
    });
    it("should not react to responses of other queues", async () => {
      const { request, client, add, waitForCalls } = setup();
      const otherRequest = client.createRequest()({ endpoint: "/other", method: "POST", queued: true });
      const { result } = renderHook(() => useQueue(request));

      const requestId = add();
      add(otherRequest);
      const calls = await waitForCalls(2);

      act(() => {
        calls[1].succeed();
      });
      await waitFor(() => {
        expect(client.submitDispatcher.getQueue(otherRequest.queryKey).requests).toHaveLength(0);
      });

      expect(getIds(result.current.requests)).toStrictEqual([requestId]);
      expect(result.current.requests[0].success).toBeFalse();
    });
    it("should follow the new queue when the request changes", async () => {
      const { request, client, add, waitForCalls } = setup();
      const otherRequest = client.createRequest()({ endpoint: "/other", method: "POST", queued: true });
      const { result, rerender } = renderHook(({ current }: { current: RequestInstance }) => useQueue(current), {
        initialProps: { current: request as RequestInstance },
      });

      add();
      const otherId = add(otherRequest);
      await waitForCalls(2);

      rerender({ current: otherRequest });

      expect(getIds(result.current.requests)).toStrictEqual([otherId]);
    });
    it("should stop listening to the previous queue when the request changes", async () => {
      const { request, client, add, waitForCalls } = setup();
      const otherRequest = client.createRequest()({ endpoint: "/other", method: "POST", queued: true });
      const { result, rerender } = renderHook(({ current }: { current: RequestInstance }) => useQueue(current), {
        initialProps: { current: request as RequestInstance },
      });

      rerender({ current: otherRequest });
      add();
      add();
      await waitForCalls(1);

      expect(result.current.requests).toStrictEqual([]);
    });
  });

  describe("given the dispatcherType option", () => {
    it("should read a GET request from the fetch dispatcher by default", async () => {
      const { request, client, add, waitForCall } = setup({ method: "GET" });
      const { result } = renderHook(() => useQueue(request));

      const requestId = add();
      await waitForCall(0);

      expect(result.current.dispatcher).toBe(client.fetchDispatcher);
      expect(getIds(result.current.requests)).toStrictEqual([requestId]);
    });
    it("should read the submit dispatcher when asked to", async () => {
      const { request, client, add, waitForCall } = setup({ method: "GET" });
      const { result } = renderHook(() => useQueue(request, { dispatcherType: "submit" }));

      add();
      await waitForCall(0);

      expect(result.current.dispatcher).toBe(client.submitDispatcher);
      expect(result.current.requests).toStrictEqual([]);
    });
    it("should read the fetch dispatcher for a mutation when asked to", async () => {
      const { request, client } = setup();
      const { result } = renderHook(() => useQueue(request, { dispatcherType: "fetch" }));
      let requestId = "";

      act(() => {
        requestId = client.fetchDispatcher.add(request);
      });

      expect(result.current.dispatcher).toBe(client.fetchDispatcher);
      expect(getIds(result.current.requests)).toStrictEqual([requestId]);
    });
    it("should take the options from the provider config", async () => {
      const { request, client } = setup({ method: "GET" });
      const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider config={{ useQueueConfig: { dispatcherType: "submit" } }}>{children}</Provider>
      );

      const { result } = renderHook(() => useQueue(request), { wrapper });

      expect(result.current.dispatcher).toBe(client.submitDispatcher);
    });
    it("should prefer the hook options over the provider config", async () => {
      const { request, client } = setup({ method: "GET" });
      const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider config={{ useQueueConfig: { dispatcherType: "submit" } }}>{children}</Provider>
      );

      const { result } = renderHook(() => useQueue(request, { dispatcherType: "fetch" }), { wrapper });

      expect(result.current.dispatcher).toBe(client.fetchDispatcher);
    });
  });

  describe("given two hooks watch the same queue", () => {
    it("should show the same list in both", async () => {
      const { request, add, waitForCall } = setup();
      const first = renderHook(() => useQueue(request));
      const second = renderHook(() => useQueue(request));

      const ids = [add(), add(), add()];
      await waitForCall(0);

      expect(getIds(first.result.current.requests)).toStrictEqual(ids);
      expect(getIds(second.result.current.requests)).toStrictEqual(ids);
    });
    it("should keep the second hook updated after the first one unmounts", async () => {
      const { request, add, waitForCall } = setup();
      const first = renderHook(() => useQueue(request));
      const second = renderHook(() => useQueue(request));

      first.unmount();
      const ids = [add(), add()];
      await waitForCall(0);

      expect(getIds(second.result.current.requests)).toStrictEqual(ids);
    });
    it("should show a hook mounted later the current queue", async () => {
      const { request, add, waitForCall } = setup();
      const first = renderHook(() => useQueue(request));

      const ids = [add(), add()];
      const call = await waitForCall(0);
      act(() => {
        call.upload(5, 10);
      });

      const second = renderHook(() => useQueue(request));

      expect(getIds(second.result.current.requests)).toStrictEqual(ids);
      expect(getIds(first.result.current.requests)).toStrictEqual(ids);
    });
  });

  describe("given the hook unmounts and mounts again", () => {
    it("should pick up the requests queued in the meantime", async () => {
      const { request, add, waitForCall } = setup();
      const first = renderHook(() => useQueue(request));
      const firstId = add();
      await waitForCall(0);
      first.unmount();

      const secondId = add();
      const second = renderHook(() => useQueue(request));

      expect(getIds(second.result.current.requests)).toStrictEqual([firstId, secondId]);
    });
    it("should not list requests that finished while it was unmounted", async () => {
      const { request, add, waitForCall, client } = setup();
      const first = renderHook(() => useQueue(request));
      add();
      const secondId = add();
      const call = await waitForCall(0);
      first.unmount();

      call.succeed();
      await waitForCall(1);
      await waitFor(() => {
        expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(1);
      });

      const second = renderHook(() => useQueue(request));

      expect(getIds(second.result.current.requests)).toStrictEqual([secondId]);
    });
    it("should not update or warn after the unmount", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => null);
      const { request, add, waitForCall, client } = setup();
      const view = renderHook(() => useQueue(request));
      add();
      add();
      const call = await waitForCall(0);
      const beforeUnmount = view.result.current.requests;

      view.unmount();
      call.upload(1, 2);
      call.succeed();
      await waitForCall(1);
      await waitFor(() => {
        expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(1);
      });

      expect(view.result.current.requests).toBe(beforeUnmount);
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("given the hook is rendered in StrictMode", () => {
    it("should list the queued requests", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request), { wrapper: StrictMode });

      const ids = [add(), add()];
      await waitForCall(0);

      expect(getIds(result.current.requests)).toStrictEqual(ids);
    });
    it("should keep following the queue after the double mount", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request), { wrapper: StrictMode });

      add();
      const second = add();
      const call = await waitForCall(0);
      act(() => {
        call.succeed();
      });

      await waitFor(() => {
        expect(getIds(result.current.requests)).toStrictEqual([second]);
      });
    });
    it("should subscribe once", async () => {
      const plain = setup();
      const strict = setup();
      const count = (emitter: {
        eventNames: () => (string | symbol)[];
        listenerCount: (name: string | symbol) => number;
      }) => emitter.eventNames().reduce((sum, name) => sum + emitter.listenerCount(name), 0);

      renderHook(() => useQueue(plain.request));
      renderHook(() => useQueue(strict.request), { wrapper: StrictMode });

      expect(count(strict.client.requestManager.emitter)).toBe(count(plain.client.requestManager.emitter));
      expect(count(strict.client.submitDispatcher.emitter)).toBe(count(plain.client.submitDispatcher.emitter));
    });
  });
});
