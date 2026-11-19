import type { RequestInstance } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { QueueRequest, UseQueueReturnType } from "hooks/use-queue";
import { useQueue } from "hooks/use-queue";
import { expectTypeOf } from "vitest";

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
  return { ...gated, request, dispatcher, add };
};

const getIds = (requests: QueueRequest<RequestInstance>[]) => requests.map((item) => item.requestId);

/** Run the pending timers and promise callbacks - for the tests using fake timers */
const advance = async (time = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(time);
  });
};

describe("useQueue [ Progress ]", () => {
  describe("when a request reports upload progress", () => {
    it("should start with an empty progress", async () => {
      const { request, add, dispatcher } = setup();
      dispatcher.stop(request.queryKey);
      const { result } = renderHook(() => useQueue(request));

      add();

      const emptyProgress = { progress: 0, timeLeft: 0, sizeLeft: 0, total: 0, loaded: 0, startTimestamp: 0 };
      expect(result.current.requests[0].uploading).toStrictEqual(emptyProgress);
      expect(result.current.requests[0].downloading).toStrictEqual(emptyProgress);
    });
    it("should update the progress of that request", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const call = await waitForCall(0);

      act(() => {
        call.upload(40, 100);
      });

      expect(result.current.requests[0].uploading.loaded).toBe(40);
      expect(result.current.requests[0].uploading.total).toBe(100);
      expect(result.current.requests[0].uploading.progress).toBe(40);
      expect(result.current.requests[0].uploading.sizeLeft).toBe(60);
    });
    it("should follow the progress up to the end", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const call = await waitForCall(0);
      const seen: number[] = [];

      [10, 55, 100].forEach((loaded) => {
        act(() => {
          call.upload(loaded, 100);
        });
        seen.push(result.current.requests[0].uploading.progress);
      });

      expect(seen).toStrictEqual([10, 55, 100]);
    });
    it("should not touch the progress of the waiting requests", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      add();
      const call = await waitForCall(0);

      act(() => {
        call.upload(40, 100);
      });

      expect(result.current.requests[1].uploading.loaded).toBe(0);
      expect(result.current.requests[1].downloading.loaded).toBe(0);
    });
    it("should track two running requests separately", async () => {
      const { request, add, waitForCalls } = setup({ queued: false });
      const { result } = renderHook(() => useQueue(request));
      add();
      add();
      const calls = await waitForCalls(2);

      act(() => {
        calls[0].upload(10, 100);
        calls[1].upload(70, 100);
      });

      expect(result.current.requests.map((item) => item.uploading.loaded)).toStrictEqual([10, 70]);
    });
    it("should keep the progress when another request joins the queue", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const call = await waitForCall(0);
      act(() => {
        call.upload(40, 100);
      });

      add();

      expect(result.current.requests[0].uploading.loaded).toBe(40);
    });
    it("should keep the progress when the queue status changes", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const call = await waitForCall(0);
      act(() => {
        call.upload(40, 100);
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.requests[0].uploading.loaded).toBe(40);
    });
    it("should ignore the progress of an unknown request", async () => {
      const { request, add, waitForCall, client } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      await waitForCall(0);
      const before = result.current.requests;

      act(() => {
        client.requestManager.events.emitUploadProgress({
          progress: 50,
          timeLeft: 1,
          sizeLeft: 5,
          total: 10,
          loaded: 5,
          startTimestamp: 1,
          requestId: "unknown",
          request,
        });
      });

      expect(result.current.requests[0]).toBe(before[0]);
    });
  });

  describe("when a request reports download progress", () => {
    it("should update the progress of that request", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const call = await waitForCall(0);

      act(() => {
        call.download(25, 50);
      });

      expect(result.current.requests[0].downloading.loaded).toBe(25);
      expect(result.current.requests[0].downloading.total).toBe(50);
      expect(result.current.requests[0].downloading.progress).toBe(50);
    });
    it("should keep the upload and download progress apart", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const call = await waitForCall(0);

      act(() => {
        call.upload(100, 100);
        call.download(10, 200);
      });

      expect(result.current.requests[0].uploading.loaded).toBe(100);
      expect(result.current.requests[0].downloading.loaded).toBe(10);
    });
    it("should show the same progress in two hooks", async () => {
      const { request, add, waitForCall } = setup();
      const first = renderHook(() => useQueue(request));
      const second = renderHook(() => useQueue(request));
      add();
      const call = await waitForCall(0);

      act(() => {
        call.download(25, 50);
      });

      expect(first.result.current.requests[0].downloading.loaded).toBe(25);
      expect(second.result.current.requests[0].downloading.loaded).toBe(25);
    });
  });
});

describe("useQueue [ Finished requests ]", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given keepFinishedRequests is off", () => {
    it("should drop a request as soon as it succeeds", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const call = await waitForCall(0);

      act(() => {
        call.succeed();
      });

      await waitFor(() => {
        expect(result.current.requests).toStrictEqual([]);
      });
    });
    it("should drop a request as soon as it fails for good", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request));
      add();
      const call = await waitForCall(0);

      act(() => {
        call.fail();
      });

      await waitFor(() => {
        expect(result.current.requests).toStrictEqual([]);
      });
    });
    it("should keep a request that waits for its retry", async () => {
      vi.useFakeTimers();
      const { request, add, calls } = setup({ retry: 1, retryTime: 5000 });
      const { result } = renderHook(() => useQueue(request));
      const requestId = add();
      await advance();

      calls[0].fail();
      await advance();

      expect(getIds(result.current.requests)).toStrictEqual([requestId]);
      expect(result.current.requests[0].failed).toBeFalse();
    });
  });

  describe("given keepFinishedRequests is on", () => {
    it("should keep a successful request and mark it as success", async () => {
      const { request, add, waitForCall, dispatcher } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      const requestId = add();
      const call = await waitForCall(0);

      act(() => {
        call.succeed();
      });

      await waitFor(() => {
        expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });
      expect(getIds(result.current.requests)).toStrictEqual([requestId]);
      expect(result.current.requests[0].success).toBeTrue();
      expect(result.current.requests[0].failed).toBeFalse();
      expect(result.current.requests[0].removed).toBeFalse();
    });
    it("should keep a failed request and mark it as failed", async () => {
      const { request, add, waitForCall, dispatcher } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      const requestId = add();
      const call = await waitForCall(0);

      act(() => {
        call.fail();
      });

      await waitFor(() => {
        expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });
      expect(getIds(result.current.requests)).toStrictEqual([requestId]);
      expect(result.current.requests[0].failed).toBeTrue();
      expect(result.current.requests[0].success).toBeFalse();
    });
    it("should keep the finished requests in front of the waiting ones", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      const ids = [add(), add(), add()];
      const call = await waitForCall(0);

      act(() => {
        call.succeed();
      });
      await waitForCall(1);

      await waitFor(() => {
        expect(result.current.requests[0].success).toBeTrue();
      });
      expect(getIds(result.current.requests)).toStrictEqual(ids);
      expect(result.current.requests.map((item) => item.success)).toStrictEqual([true, false, false]);
    });
    it("should add new requests after the finished ones", async () => {
      const { request, add, waitForCall, dispatcher } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      const first = add();
      const call = await waitForCall(0);
      act(() => {
        call.succeed();
      });
      await waitFor(() => {
        expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });

      const second = add();
      const third = add();

      expect(getIds(result.current.requests)).toStrictEqual([first, second, third]);
    });
    it("should keep the whole history of a drained queue", async () => {
      const { request, add, waitForCall, dispatcher } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      const ids = [add(), add(), add()];

      for (let index = 0; index < ids.length; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        const call = await waitForCall(index);
        act(() => {
          if (index === 1) {
            call.fail();
          } else {
            call.succeed();
          }
        });
      }
      await waitFor(() => {
        expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });

      expect(getIds(result.current.requests)).toStrictEqual(ids);
      expect(result.current.requests.map((item) => item.success)).toStrictEqual([true, false, true]);
      expect(result.current.requests.map((item) => item.failed)).toStrictEqual([false, true, false]);
    });
    it("should keep the last progress of a finished request", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      add();
      const call = await waitForCall(0);

      act(() => {
        call.upload(100, 100);
        call.succeed();
      });

      await waitFor(() => {
        expect(result.current.requests[0].success).toBeTrue();
      });
      expect(result.current.requests[0].uploading.loaded).toBe(100);
    });
    it("should not change the progress of a finished request", async () => {
      const { request, add, waitForCall, client } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      const requestId = add();
      const call = await waitForCall(0);
      act(() => {
        call.upload(100, 100);
        call.succeed();
      });
      await waitFor(() => {
        expect(result.current.requests[0].success).toBeTrue();
      });

      act(() => {
        client.requestManager.events.emitUploadProgress({
          progress: 1,
          timeLeft: 1,
          sizeLeft: 99,
          total: 100,
          loaded: 1,
          startTimestamp: 1,
          requestId,
          request,
        });
      });

      expect(result.current.requests[0].uploading.loaded).toBe(100);
    });
    it("should mark a deleted waiting request as removed", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      const ids = [add(), add()];
      await waitForCall(0);

      act(() => {
        result.current.requests[1].deleteRequest();
      });

      expect(getIds(result.current.requests)).toStrictEqual(ids);
      expect(result.current.requests[1].removed).toBeTrue();
      expect(result.current.requests[0].removed).toBeFalse();
    });
    it("should mark a deleted running request as canceled and removed", async () => {
      const { request, add, waitForCall } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      add();
      await waitForCall(0);

      act(() => {
        result.current.requests[0].deleteRequest();
      });

      expect(result.current.requests[0].removed).toBeTrue();
      expect(result.current.requests[0].canceled).toBeTrue();
      expect(result.current.requests[0].failed).toBeFalse();
    });
    it("should not mark a successful request as removed", async () => {
      const { request, add, waitForCall, dispatcher } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      add();
      const call = await waitForCall(0);

      act(() => {
        call.succeed();
      });
      await waitFor(() => {
        expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });

      expect(result.current.requests[0].success).toBeTrue();
      expect(result.current.requests[0].removed).toBeFalse();
    });
    it("should start a new history when the request changes", async () => {
      const { request, client, add, waitForCall, dispatcher } = setup();
      const otherRequest = client.createRequest()({ endpoint: "/other", method: "POST", queued: true });
      const { result, rerender } = renderHook(
        ({ current }: { current: RequestInstance }) => useQueue(current, { keepFinishedRequests: true }),
        { initialProps: { current: request as RequestInstance } },
      );
      add();
      const call = await waitForCall(0);
      act(() => {
        call.succeed();
      });
      await waitFor(() => {
        expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });
      expect(result.current.requests).toHaveLength(1);

      rerender({ current: otherRequest });

      expect(result.current.requests).toStrictEqual([]);
    });
  });

  describe("given the request can be retried", () => {
    it("should not mark the request as failed while it waits for the retry", async () => {
      vi.useFakeTimers();
      const { request, add, calls } = setup({ retry: 2, retryTime: 5000 });
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      add();
      await advance();

      calls[0].fail();
      await advance();

      expect(result.current.requests[0].failed).toBeFalse();
      expect(result.current.requests[0].success).toBeFalse();
    });
    it("should mark the request as success when the retry succeeds", async () => {
      vi.useFakeTimers();
      const { request, add, calls } = setup({ retry: 1, retryTime: 5000 });
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      add();
      await advance();
      calls[0].fail();
      await advance(5000);
      expect(calls).toHaveLength(2);

      calls[1].succeed();
      await advance();

      expect(result.current.requests[0].success).toBeTrue();
      expect(result.current.requests[0].failed).toBeFalse();
    });
    it("should mark the request as failed only after the last retry", async () => {
      vi.useFakeTimers();
      const { request, add, calls } = setup({ retry: 2, retryTime: 5000 });
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      add();
      await advance();
      const failedAfterAttempt: boolean[] = [];

      for (let attempt = 0; attempt < 3; attempt += 1) {
        calls[attempt].fail();
        // eslint-disable-next-line no-await-in-loop
        await advance();
        failedAfterAttempt.push(!!result.current.requests[0].failed);
        // eslint-disable-next-line no-await-in-loop
        await advance(5000);
      }

      expect(calls).toHaveLength(3);
      expect(failedAfterAttempt).toStrictEqual([false, false, true]);
    });
    it("should keep tracking the progress of the retry", async () => {
      vi.useFakeTimers();
      const { request, add, calls } = setup({ retry: 1, retryTime: 5000 });
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      add();
      await advance();
      calls[0].upload(100, 100);
      calls[0].fail();
      await advance(5000);

      act(() => {
        calls[1].upload(30, 100);
      });

      expect(result.current.requests[0].uploading.loaded).toBe(30);
    });
    it("should keep the next request waiting during the retries", async () => {
      vi.useFakeTimers();
      const { request, add, calls } = setup({ retry: 1, retryTime: 5000 });
      const { result } = renderHook(() => useQueue(request));
      const ids = [add(), add()];
      await advance();

      calls[0].fail();
      await advance();

      expect(getIds(result.current.requests)).toStrictEqual(ids);
    });
  });

  describe("given the application goes offline", () => {
    it("should keep an offline request in the list without marking it as failed", async () => {
      const { request, add, waitForCall, client, dispatcher } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      const requestId = add();
      const call = await waitForCall(0);

      act(() => {
        client.appManager.setOnline(false);
        call.fail();
      });
      await waitFor(() => {
        expect(dispatcher.hasRunningRequests(request.queryKey)).toBeFalse();
      });

      expect(getIds(result.current.requests)).toStrictEqual([requestId]);
      expect(result.current.requests[0].failed).toBeFalse();
    });
    it("should send the request again when the connection is back", async () => {
      const { request, add, waitForCall, client, dispatcher } = setup();
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      const requestId = add();
      const call = await waitForCall(0);
      act(() => {
        client.appManager.setOnline(false);
        call.fail();
      });
      await waitFor(() => {
        expect(dispatcher.hasRunningRequests(request.queryKey)).toBeFalse();
      });

      act(() => {
        client.appManager.setOnline(true);
      });
      const retried = await waitForCall(1);
      expect(retried.requestId).toBe(requestId);
      act(() => {
        retried.succeed();
      });

      await waitFor(() => {
        expect(result.current.requests[0].success).toBeTrue();
      });
      expect(result.current.requests[0].failed).toBeFalse();
    });
    it("should mark a request that does not wait for the network as failed", async () => {
      const { request, add, waitForCall, client } = setup({ offline: false });
      const { result } = renderHook(() => useQueue(request, { keepFinishedRequests: true }));
      add();
      const call = await waitForCall(0);

      act(() => {
        client.appManager.setOnline(false);
        call.fail();
      });

      await waitFor(() => {
        expect(result.current.requests[0].failed).toBeTrue();
      });
    });
    it("should keep the requests queued while offline in the list", async () => {
      const { request, add, client, calls } = setup();
      const { result } = renderHook(() => useQueue(request));
      act(() => {
        client.appManager.setOnline(false);
      });

      const ids = [add(), add()];

      expect(getIds(result.current.requests)).toStrictEqual(ids);
      expect(calls).toHaveLength(0);
    });
  });
});

describe("useQueue [ Types ]", () => {
  const { client } = createGatedClient();
  const upload = client.createRequest<{ response: { url: string }; payload: { file: string } }>()({
    endpoint: "/files/:folderId",
    method: "POST",
  });
  type Result = UseQueueReturnType<typeof upload>;

  it("should type the returned queue state", () => {
    expectTypeOf<Result["stopped"]>().toEqualTypeOf<boolean>();
    expectTypeOf<Result["requests"]>().toEqualTypeOf<QueueRequest<typeof upload>[]>();
    expectTypeOf<Result["stop"]>().toEqualTypeOf<() => void>();
    expectTypeOf<Result["pause"]>().toEqualTypeOf<() => void>();
    expectTypeOf<Result["start"]>().toEqualTypeOf<() => void>();
  });
  it("should type the request of every item", () => {
    expectTypeOf<Result["requests"][number]["request"]>().toEqualTypeOf<typeof upload>();
    expectTypeOf<Result["requests"][number]["requestId"]>().toEqualTypeOf<string>();
  });
  it("should type the progress and the actions of every item", () => {
    expectTypeOf<Result["requests"][number]["uploading"]["progress"]>().toEqualTypeOf<number>();
    expectTypeOf<Result["requests"][number]["downloading"]["loaded"]>().toEqualTypeOf<number>();
    expectTypeOf<Result["requests"][number]["stopRequest"]>().toEqualTypeOf<() => void>();
    expectTypeOf<Result["requests"][number]["startRequest"]>().toEqualTypeOf<() => void>();
    expectTypeOf<Result["requests"][number]["deleteRequest"]>().toEqualTypeOf<() => void>();
  });
  it("should accept only the known options", () => {
    expectTypeOf(useQueue<typeof upload>)
      .parameter(1)
      .toEqualTypeOf<{ dispatcherType?: "auto" | "fetch" | "submit"; keepFinishedRequests?: boolean } | undefined>();
  });
});
