import type { RequestInstance } from "@hyper-fetch/core";
import { Plugin } from "@hyper-fetch/core";

import { DevtoolsEventHandler } from "./devtools.event.handler";
import { CustomEvents, EventSourceType } from "./types/events.types";
import type { DevtoolsPluginOptions } from "./types/plugin.types";

/** Create a devtools plugin that streams request lifecycle events to the HyperFlow desktop app for inspection. */
export const DevtoolsPlugin = (options: DevtoolsPluginOptions) => {
  const plugin = new Plugin({
    name: "plugin-devtools",
    data: {
      eventHandler: undefined as DevtoolsEventHandler | undefined,
      requests: [] as RequestInstance[],
    },
  });

  plugin.onMount(({ client }) => {
    plugin.data.eventHandler = new DevtoolsEventHandler(client, options);
  });

  plugin.onRequestCreate(({ request }) => {
    plugin.data.requests.push(request);
    plugin.data.eventHandler?.sendEvent({
      eventSource: EventSourceType.CUSTOM_EVENT,
      eventName: CustomEvents.REQUEST_CREATED,
      data: plugin.data.requests,
      isTriggeredExternally: false,
    });
  });

  return plugin;
};
