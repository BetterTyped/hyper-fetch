import { createControlledClient, flushPromises } from "../../utils/controlled-adapter.utils";

/**
 * Response listeners run while the answered request is still in its queue. Sending another request from one of them
 * (the next step of a flow, a refetch) must send only that request - not the answered one once again.
 */
describe("Dispatcher [ Sending from response callbacks ]", () => {
  const setup = (options: { queued?: boolean; retry?: number; retryTime?: number } = {}) => {
    const { client, calls } = createControlledClient();
    const request = client.createRequest<{ response: unknown; payload: { step: number } }>()({
      endpoint: "/steps",
      method: "POST",
      ...options,
    });
    // Every attempt of sending is listed - also the ones canceled before they reach the adapter
    const attempts: unknown[] = [];
    const canceled: unknown[] = [];
    client.requestManager.events.onLoading(({ loading, request: sent }) => {
      if (loading) {
        attempts.push(sent.payload);
      }
    });
    client.requestManager.events.onResponse(({ details, request: answered }) => {
      if (details.isCanceled) {
        canceled.push(answered.payload);
      }
    });
    const payloads = () => {
      expect(canceled).toStrictEqual([]);
      expect(calls.map((call) => call.request.payload)).toStrictEqual(attempts);
      return attempts;
    };

    return { client, calls, request, payloads };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe.each([
    ["concurrent", false],
    ["queued", true],
  ])("When the requests are %s", (_name, queued) => {
    it("should send only the next request from the onResponse option", async () => {
      const { calls, request, payloads } = setup({ queued });
      let next: Promise<unknown> | undefined;

      const first = request.send({
        payload: { step: 1 },
        onResponse: () => {
          next = request.send({ payload: { step: 2 } });
        },
      });
      await flushPromises();
      await calls[0].succeed();
      await flushPromises();

      expect(payloads()).toStrictEqual([{ step: 1 }, { step: 2 }]);

      await calls[1].succeed();
      await Promise.all([first, next]);
      await vi.advanceTimersByTimeAsync(1000);

      expect(payloads()).toStrictEqual([{ step: 1 }, { step: 2 }]);
    });

    it("should send only the next request from a response event listener", async () => {
      const { client, calls, request, payloads } = setup({ queued });
      let sent = false;
      client.requestManager.events.onResponse(() => {
        if (!sent) {
          sent = true;
          request.send({ payload: { step: 2 } });
        }
      });

      request.send({ payload: { step: 1 } });
      await flushPromises();
      await calls[0].succeed();
      await flushPromises();
      await calls[1]?.succeed();
      await vi.advanceTimersByTimeAsync(1000);

      expect(payloads()).toStrictEqual([{ step: 1 }, { step: 2 }]);
    });

    it("should send only the next request after a failed response", async () => {
      const { calls, request, payloads } = setup({ queued });

      request.send({
        payload: { step: 1 },
        onResponse: () => {
          request.send({ payload: { step: 2 } });
        },
      });
      await flushPromises();
      await calls[0].fail();
      await flushPromises();
      await calls[1]?.succeed();
      await vi.advanceTimersByTimeAsync(1000);

      expect(payloads()).toStrictEqual([{ step: 1 }, { step: 2 }]);
    });

    it("should run a chain of requests, each sent from the response of the previous one", async () => {
      const { calls, request, payloads } = setup({ queued });
      const sendStep = (step: number): Promise<unknown> =>
        request.send({
          payload: { step },
          onResponse: () => {
            if (step < 5) {
              sendStep(step + 1);
            }
          },
        });

      sendStep(1);
      for (let index = 0; index < 5; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await flushPromises();
        // eslint-disable-next-line no-await-in-loop
        await calls[index].succeed();
      }
      await vi.advanceTimersByTimeAsync(1000);

      expect(payloads()).toStrictEqual([1, 2, 3, 4, 5].map((step) => ({ step })));
    });
  });

  describe.each([
    ["concurrent", false],
    ["queued", true],
  ])("When a %s request is added to the dispatcher directly from a response listener", (_name, queued) => {
    it("should not send the answered request again after a success", async () => {
      const { client, calls, request, payloads } = setup({ queued });
      let added = false;
      client.requestManager.events.onResponse(() => {
        if (!added) {
          added = true;
          client.submitDispatcher.add(request.setPayload({ step: 2 }));
        }
      });

      client.submitDispatcher.add(request.setPayload({ step: 1 }));
      await flushPromises();
      await calls[0].succeed();
      await flushPromises();
      await calls[1]?.succeed();
      await vi.advanceTimersByTimeAsync(1000);

      expect(payloads()).toStrictEqual([{ step: 1 }, { step: 2 }]);
    });

    it("should not send the answered request again after a failure", async () => {
      const { client, calls, request, payloads } = setup({ queued });
      let added = false;
      client.requestManager.events.onResponse(() => {
        if (!added) {
          added = true;
          client.submitDispatcher.add(request.setPayload({ step: 2 }));
        }
      });

      client.submitDispatcher.add(request.setPayload({ step: 1 }));
      await flushPromises();
      await calls[0].fail();
      await flushPromises();
      await calls[1]?.succeed();
      await vi.advanceTimersByTimeAsync(1000);

      expect(payloads()).toStrictEqual([{ step: 1 }, { step: 2 }]);
    });

    it("should not send the answered request again when added from a loading listener", async () => {
      const { client, calls, request, payloads } = setup({ queued });
      let added = false;
      client.requestManager.events.onLoading(({ loading }) => {
        if (!loading && !added) {
          added = true;
          client.submitDispatcher.add(request.setPayload({ step: 2 }));
        }
      });

      client.submitDispatcher.add(request.setPayload({ step: 1 }));
      await flushPromises();
      await calls[0].succeed();
      await flushPromises();
      await calls[1]?.succeed();
      await vi.advanceTimersByTimeAsync(1000);

      expect(payloads()).toStrictEqual([{ step: 1 }, { step: 2 }]);
    });

    it("should leave the queue empty once both requests are answered", async () => {
      const { client, calls, request } = setup({ queued });
      let added = false;
      client.requestManager.events.onResponse(() => {
        if (!added) {
          added = true;
          client.submitDispatcher.add(request.setPayload({ step: 2 }));
        }
      });

      client.submitDispatcher.add(request.setPayload({ step: 1 }));
      await flushPromises();
      await calls[0].succeed();
      await flushPromises();
      await calls[1]?.succeed();
      await vi.advanceTimersByTimeAsync(1000);

      expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });
  });

  describe("When the answered request is going to be retried", () => {
    it("should keep its retry time when another request is sent from its response listener", async () => {
      const { client, calls, request, payloads } = setup({ retry: 1, retryTime: 500 });
      let sent = false;
      client.requestManager.events.onResponse(() => {
        if (!sent) {
          sent = true;
          request.send({ payload: { step: 2 } });
        }
      });

      request.send({ payload: { step: 1 } });
      await flushPromises();
      await calls[0].fail();
      await flushPromises();

      // Only the new request went out - the failed one waits for its retry time
      expect(payloads()).toStrictEqual([{ step: 1 }, { step: 2 }]);

      await calls[1].succeed();
      await vi.advanceTimersByTimeAsync(500);

      expect(payloads()).toStrictEqual([{ step: 1 }, { step: 2 }, { step: 1 }]);
    });
  });

  describe("When the answered request stays in the queue", () => {
    it("should send the request kept for the network when the connection is back in its response listener", async () => {
      const { client, calls, request } = setup();
      let restored = false;
      client.requestManager.events.onResponse(() => {
        if (!restored) {
          restored = true;
          client.appManager.setOnline(true);
        }
      });

      const sent = request.send({ payload: { step: 1 } });
      await flushPromises();
      client.appManager.setOnline(false);
      await calls[0].fail();
      await flushPromises();

      expect(calls).toHaveLength(2);
      expect(calls[1].requestId).toBe(calls[0].requestId);

      await calls[1].succeed({ done: true });
      const response = await sent;

      expect(response.data).toStrictEqual({ done: true });
      expect(calls).toHaveLength(2);
    });

    it("should keep the request waiting for the network when the connection is still down", async () => {
      const { client, calls, request } = setup();
      client.requestManager.events.onResponse(() => {
        request.send({ payload: { step: 2 } });
      });

      request.send({ payload: { step: 1 } });
      await flushPromises();
      client.appManager.setOnline(false);
      await calls[0].fail();
      await vi.advanceTimersByTimeAsync(1000);

      expect(calls).toHaveLength(1);

      client.appManager.setOnline(true);
      await flushPromises();

      expect(calls.map((call) => call.request.payload)).toStrictEqual([{ step: 1 }, { step: 1 }, { step: 2 }]);
    });
  });

  describe("When nothing is sent from the listeners", () => {
    it("should still send the requests added while another one is in flight", async () => {
      const { calls, request, payloads } = setup();

      request.send({ payload: { step: 1 } });
      await flushPromises();
      request.send({ payload: { step: 2 } });
      await flushPromises();
      await calls[0].succeed();
      await calls[1].succeed();

      expect(payloads()).toStrictEqual([{ step: 1 }, { step: 2 }]);
    });
  });
});
