import { Client } from "client";
import { Plugin } from "plugin";
import type { RequestInstance, RequestSendOptionsType } from "request";

import { getThrownErrors } from "../../utils/fixtures.utils";

/**
 * Callbacks, listeners, plugins and optimistic handlers are the code of the user running inside of the request
 * lifecycle. All of them are handled the same way: the lifecycle goes on, and the error is thrown outside of it,
 * so it reaches the error handlers of the environment instead of getting lost.
 */
describe("Client [ Errors of the user code ]", () => {
  const failure = new Error("User code failed");
  const throwing = () => {
    throw failure;
  };

  const setup = (outcome: "success" | "error" = "success") => {
    const client = new Client({ url: "http://user-errors" });
    const list = client.createRequest<{ response: string[] }>()({ endpoint: "/list" });
    const request = client
      .createRequest<{ response: { id: number }; error: { message: string } }>()({ endpoint: "/users", method: "POST" })
      .setMock(
        () =>
          outcome === "success" ? { data: { id: 1 }, status: 200 } : { error: { message: "Failed" }, status: 400 },
        { requestTime: 0, responseTime: 0 },
      );

    return { client, request, list };
  };

  type Setup = ReturnType<typeof setup>;
  type Scenario = {
    name: string;
    outcome?: "success" | "error";
    /** Puts the throwing code in place, returns the request to send and the options for it */
    arrange: (
      context: Setup,
    ) => { request?: RequestInstance; options?: RequestSendOptionsType<RequestInstance> } | void;
  };

  const scenarios: Scenario[] = [
    { name: "the onBeforeSent callback", arrange: () => ({ options: { onBeforeSent: throwing } }) },
    { name: "the onRequestStart callback", arrange: () => ({ options: { onRequestStart: throwing } }) },
    { name: "the onResponseStart callback", arrange: () => ({ options: { onResponseStart: throwing } }) },
    { name: "the onResponse callback", arrange: () => ({ options: { onResponse: throwing } }) },
    {
      name: "the onResponse callback of a failed request",
      outcome: "error",
      arrange: () => ({ options: { onResponse: throwing } }),
    },
    {
      name: "a hook of the request",
      arrange: ({ request }) => {
        request.$hooks.onResponse(throwing);
      },
    },
    {
      name: "a listener of the response event",
      arrange: ({ client }) => {
        client.requestManager.events.onResponse(throwing);
      },
    },
    {
      name: "a listener of the loading event",
      arrange: ({ client }) => {
        client.requestManager.events.onLoading(({ loading }) => {
          if (!loading) {
            throwing();
          }
        });
      },
    },
    {
      name: "a listener of the cache data",
      arrange: ({ client, request }) => {
        client.cache.events.onDataByKey(request.cacheKey, throwing);
      },
    },
    ...(["onRequestTrigger", "onRequestStart", "onRequestSuccess", "onRequestFinished"] as const).map(
      (hook): Scenario => ({
        name: `the ${hook} hook of a plugin`,
        arrange: ({ client }) => {
          client.addPlugin(new Plugin({ name: "failing" })[hook](throwing));
        },
      }),
    ),
    {
      name: "the onRequestError hook of a plugin",
      outcome: "error",
      arrange: ({ client }) => {
        client.addPlugin(new Plugin({ name: "failing" }).onRequestError(throwing));
      },
    },
    {
      name: "the onCacheItemChange hook of a plugin",
      arrange: ({ client }) => {
        client.addPlugin(new Plugin({ name: "failing" }).onCacheItemChange(throwing));
      },
    },
    {
      name: "the onDispatcherItemDeleted hook of a plugin",
      arrange: ({ client }) => {
        client.addPlugin(new Plugin({ name: "failing" }).onDispatcherItemDeleted(throwing));
      },
    },
    {
      name: "the optimistic rollback",
      outcome: "error",
      arrange: ({ request }) => ({ request: request.setOptimistic(() => ({ rollback: throwing })) }),
    },
    {
      name: "the async optimistic rollback",
      outcome: "error",
      arrange: ({ request }) => ({
        request: request.setOptimistic(() => ({
          rollback: async () => {
            throw failure;
          },
        })),
      }),
    },
    {
      name: "a listener of the optimistic invalidation",
      arrange: ({ client, request, list }) => {
        client.cache.events.onInvalidateByKey(list.cacheKey, throwing);
        return { request: request.setOptimistic(() => ({ invalidate: [list] })) };
      },
    },
  ];

  describe.each(scenarios)("When $name throws", ({ arrange, outcome = "success" }) => {
    const send = async () => {
      const context = setup(outcome);
      const arranged = arrange(context) || {};
      const sent = arranged.request ?? context.request;
      let response: Awaited<ReturnType<typeof sent.send>> | undefined;

      const thrown = await getThrownErrors(async () => {
        response = await sent.send(arranged.options);
      });

      return { ...context, response, thrown };
    };

    it("should still give the response", async () => {
      const { response } = await send();

      expect(response?.success).toBe(outcome === "success");
      expect(response?.status).toBe(outcome === "success" ? 200 : 400);
    });

    it("should throw the error outside of the request lifecycle, once", async () => {
      const { thrown } = await send();

      expect(thrown).toStrictEqual([failure]);
    });

    it("should leave nothing in the queue", async () => {
      const { client, request } = await send();

      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(0);
    });
  });

  describe("When several pieces of the user code throw for one request", () => {
    it("should throw every error", async () => {
      const { client, request } = setup();
      const pluginError = new Error("Plugin failed");
      const listenerError = new Error("Listener failed");
      const callbackError = new Error("Callback failed");
      client.addPlugin(
        new Plugin({ name: "failing" }).onRequestSuccess(() => {
          throw pluginError;
        }),
      );
      client.requestManager.events.onResponse(() => {
        throw listenerError;
      });

      const thrown = await getThrownErrors(() =>
        request.send({
          onBeforeSent: () => {
            throw callbackError;
          },
        }),
      );

      expect(thrown).toHaveLength(3);
      expect(thrown).toStrictEqual(expect.arrayContaining([pluginError, listenerError, callbackError]));
    });

    it("should still call the code registered after the failing one", async () => {
      const { client, request } = setup();
      const nextPlugin = vi.fn();
      const onResponse = vi.fn();
      client
        .addPlugin(new Plugin({ name: "failing" }).onRequestSuccess(throwing))
        .addPlugin(new Plugin({ name: "next" }).onRequestSuccess(nextPlugin));
      request.$hooks.onResponse(throwing);

      await getThrownErrors(() => request.send({ onResponse }));

      expect(nextPlugin).toHaveBeenCalledTimes(1);
      expect(onResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe("When nothing throws", () => {
    it("should not throw anything outside of the lifecycle", async () => {
      const { client, request } = setup();
      client.addPlugin(new Plugin({ name: "quiet" }).onRequestSuccess(() => {}));

      const thrown = await getThrownErrors(() => request.send({ onResponse: () => {} }));

      expect(thrown).toStrictEqual([]);
    });
  });
});
