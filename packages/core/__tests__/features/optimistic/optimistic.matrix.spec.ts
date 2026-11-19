import { createHttpMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";

import { Client } from "client";
import type { RequestResponseEventType } from "managers";
import { optimistic } from "optimistic";
import type { RequestInstance } from "request";
import { scopeKey } from "request";
import { readCache, seedCache } from "../../utils/optimistic.utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

const INITIAL = ["server"];
const HELPER_ITEM = "helper";
const OBJECT_ITEM = "object";

type Form = "helpers" | "object" | "combined";

/**
 * Every form adds its own item to the list - helpers through `insert`, the object form by hand - and reverts it.
 */
const createSetup = (form: Form) => {
  const client = new Client({ url: "shared-base-url" });
  const list = client.createRequest<{ response: string[] }>()({ endpoint: "/list" });
  seedCache(client, list, INITIAL);

  const helperRollback = vi.fn(({ data }: { data: string[] }) => data.filter((item) => item !== HELPER_ITEM));
  const objectRollback = vi.fn(() => {
    client.cache.update(list, (prev) => ({ data: (prev?.data ?? []).filter((item) => item !== OBJECT_ITEM) }));
  });
  const invalidate = vi.spyOn(client.cache, "invalidate");

  const mutation = client
    .createRequest<{ response: { ok: boolean } }>()({ endpoint: "/mutation", method: "POST" })
    .setOptimistic(() => {
      const updates = [optimistic(list).insert(HELPER_ITEM).rollback(helperRollback)];
      if (form === "helpers") {
        return updates;
      }
      client.cache.update(list, (prev) => ({ data: [...(prev?.data ?? []), OBJECT_ITEM] }));
      return {
        context: { form },
        rollback: objectRollback,
        invalidate: [list],
        updates: form === "combined" ? updates : undefined,
      };
    });

  const responses: RequestResponseEventType<RequestInstance>[] = [];
  client.requestManager.events.onResponse((values) => {
    responses.push(values);
  });

  const queryKey = scopeKey(mutation.queryKey, mutation.scope);
  const abortKey = scopeKey(mutation.abortKey, mutation.scope);
  const read = () => readCache<string[]>(client, list);

  return { client, list, mutation, helperRollback, objectRollback, invalidate, responses, queryKey, abortKey, read };
};

type Setup = ReturnType<typeof createSetup>;
type Mutation = Setup["mutation"];

const optimisticList = (form: Form) => {
  if (form === "helpers") {
    return [...INITIAL, HELPER_ITEM];
  }
  if (form === "object") {
    return [...INITIAL, OBJECT_ITEM];
  }
  return [...INITIAL, OBJECT_ITEM, HELPER_ITEM];
};

/** Invalidations of the list: the object form's `invalidate` on success, the helpers' refresh after every settle */
const expectedInvalidations = (form: Form, success: boolean, rolledBack: boolean) => {
  const objectInvalidation = form !== "helpers" && success ? 1 : 0;
  const refresh = form !== "object" && (success || rolledBack) ? 1 : 0;
  return objectInvalidation + refresh;
};

const waitForResponses = async (setup: Setup, count: number) => {
  await waitFor(() => {
    expect(setup.responses).toHaveLength(count);
  });
};

const goOfflineOnFirstAttempt = (setup: Setup) => {
  let isFirstAttempt = true;
  return {
    onRequestStart: () => {
      if (isFirstAttempt) {
        isFirstAttempt = false;
        setup.client.appManager.setOnline(false);
      }
    },
  };
};

type Outcome = {
  name: string;
  build?: (mutation: Mutation) => Mutation;
  arrange: (setup: Setup, request: Mutation) => Record<string, unknown> | void;
  drive?: (setup: Setup, request: Mutation, form: Form) => Promise<void>;
  settled?: (setup: Setup) => Promise<void>;
  success: boolean;
  rollback?: "error" | "abort" | "removed";
};

const outcomes: Outcome[] = [
  {
    name: "success",
    arrange: (_, request) => mockRequest(request, { data: { ok: true } }),
    success: true,
  },
  {
    name: "final error",
    arrange: (_, request) => mockRequest(request, { status: 400 }),
    success: false,
    rollback: "error",
  },
  {
    name: "abort",
    arrange: (_, request) => {
      mockRequest(request, { delay: 100 });
      return { onRequestStart: () => request.abort() };
    },
    success: false,
    rollback: "abort",
  },
  {
    name: "queue removal",
    arrange: (setup, request) => {
      mockRequest(request);
      setup.client.submitDispatcher.stop(setup.queryKey);
      return {
        onBeforeSent: ({ requestId }: { requestId: string }) => {
          queueMicrotask(() => setup.client.submitDispatcher.delete(setup.queryKey, requestId, setup.abortKey));
        },
      };
    },
    success: false,
    rollback: "removed",
  },
  {
    name: "retry then success",
    build: (mutation) => mutation.setRetry(1).setRetryTime(10),
    arrange: (setup, request) => {
      mockRequest(request, { status: 400 });
      const unmount = setup.client.requestManager.events.onResponse(() => {
        unmount();
        // While the retry is scheduled the change stays
        expect(setup.helperRollback).not.toHaveBeenCalled();
        expect(setup.objectRollback).not.toHaveBeenCalled();
        mockRequest(request, { data: { ok: true } });
      });
    },
    success: true,
  },
  {
    name: "retry then error",
    build: (mutation) => mutation.setRetry(1).setRetryTime(10),
    arrange: (setup, request) => {
      mockRequest(request, { status: 400 });
      const unmount = setup.client.requestManager.events.onResponse(() => {
        unmount();
        mockRequest(request, { status: 500 });
      });
    },
    success: false,
    rollback: "error",
  },
  {
    name: "offline then success",
    arrange: (setup, request) => {
      mockRequest(request, { status: 400, delay: 30 });
      return goOfflineOnFirstAttempt(setup);
    },
    drive: async (setup, request, form) => {
      await waitForResponses(setup, 1);
      expect(setup.read()).toStrictEqual(optimisticList(form));
      expect(setup.invalidate).not.toHaveBeenCalled();
      mockRequest(request, { data: { ok: true } });
      setup.client.appManager.setOnline(true);
    },
    success: true,
  },
  {
    name: "offline then error",
    arrange: (setup, request) => {
      mockRequest(request, { status: 400, delay: 30 });
      return goOfflineOnFirstAttempt(setup);
    },
    drive: async (setup, request, form) => {
      await waitForResponses(setup, 1);
      expect(setup.read()).toStrictEqual(optimisticList(form));
      mockRequest(request, { status: 500 });
      setup.client.appManager.setOnline(true);
    },
    success: false,
    rollback: "error",
  },
];

const entryPoints = [
  {
    name: "send()",
    run: (request: Mutation, options: Record<string, unknown>) => {
      return request.send(options).then((result) => ({ result, observed: null }));
    },
  },
  {
    name: "$hooks",
    run: (request: Mutation, options: Record<string, unknown>, setup: Setup) => {
      let observed: { list?: string[]; rollbacks: number; invalidations: number } | null = null;
      const observe = () => {
        observed = {
          list: setup.read(),
          rollbacks: setup.helperRollback.mock.calls.length + setup.objectRollback.mock.calls.length,
          invalidations: setup.invalidate.mock.calls.length,
        };
      };
      request.$hooks.onResponse(observe);
      request.$hooks.onRemove(observe);
      return request.send(options).then((result) => ({ result, observed }));
    },
  },
];

const forms: Form[] = ["helpers", "object", "combined"];

describe("Optimistic [ Settlement matrix ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe.each(entryPoints)("when using $name", ({ name: entryPoint, run }) => {
    describe.each(forms)("when using the %s form", (form) => {
      it.each(outcomes)("should settle $name", async ({ build, arrange, drive, settled, success, rollback }) => {
        const setup = createSetup(form);
        const request = build?.(setup.mutation) ?? setup.mutation;
        const options = arrange(setup, request) ?? {};

        const pending = run(request, options, setup);
        expect(setup.read()).toStrictEqual(optimisticList(form));

        await drive?.(setup, request, form);
        const { result, observed } = await pending;
        await settled?.(setup);

        const expectedList = rollback ? INITIAL : optimisticList(form);
        const expectedRollbacks = rollback ? { helper: form !== "object" ? 1 : 0, object: form !== "helpers" ? 1 : 0 } : null;
        const invalidations = expectedInvalidations(form, success, !!rollback);

        expect(result.success).toBe(success);
        expect(setup.read()).toStrictEqual(expectedList);
        expect(setup.helperRollback).toHaveBeenCalledTimes(expectedRollbacks?.helper ?? 0);
        expect(setup.objectRollback).toHaveBeenCalledTimes(expectedRollbacks?.object ?? 0);
        expect(setup.invalidate).toHaveBeenCalledTimes(invalidations);
        if (invalidations) {
          expect(setup.invalidate).toHaveBeenCalledWith(setup.list);
        }

        if (rollback && form !== "object") {
          expect(setup.helperRollback.mock.calls[0][0]).toHaveProperty("reason", rollback);
        }
        if (rollback && form !== "helpers") {
          expect(setup.objectRollback.mock.calls[0]).toStrictEqual([expect.objectContaining({ reason: rollback })]);
        }

        // Lifecycle listeners already see the settled cache
        if (entryPoint === "$hooks") {
          expect(observed).toStrictEqual({
            list: expectedList,
            rollbacks: (expectedRollbacks?.helper ?? 0) + (expectedRollbacks?.object ?? 0),
            invalidations,
          });
        }
      });
    });
  });

  describe("when the optimistic callback is synchronous", () => {
    it("should change the cache within the send() call", () => {
      const setup = createSetup("helpers");
      mockRequest(setup.mutation, { data: { ok: true } });

      const pending = setup.mutation.send();

      expect(setup.read()).toStrictEqual(optimisticList("helpers"));
      return pending;
    });

    it("should change the cache once an async callback resolves", async () => {
      const setup = createSetup("helpers");
      const request = setup.mutation.setOptimistic(async () => [optimistic(setup.list).insert(HELPER_ITEM)]);
      mockRequest(request, { data: { ok: true }, delay: 20 });

      const pending = request.send();
      expect(setup.read()).toStrictEqual(INITIAL);

      await waitFor(() => {
        expect(setup.read()).toStrictEqual(optimisticList("helpers"));
      });
      await pending;
    });
  });
});
