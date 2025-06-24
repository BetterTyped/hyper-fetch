import { Plugin, RequestInstance } from "@hyper-fetch/core";

import { DevtoolsEventHandler } from "./devtools.event.handler";
import { CustomEvents, EventSourceType } from "./types/events.types";
import { DevtoolsPluginOptions } from "./types/plugin.types";

export const devtoolsPlugin = (options: DevtoolsPluginOptions) => {
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
    plugin.data.eventHandler?.sendEvent(EventSourceType.CUSTOM_EVENT)(
      CustomEvents.REQUEST_CREATED,
      plugin.data.requests,
      true,
    );
  });

  return plugin;
};
