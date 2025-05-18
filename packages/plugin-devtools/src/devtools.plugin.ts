import { Plugin, RequestInstance } from "@hyper-fetch/core";

import { DevtoolsEventHandler } from "./devtools.event.handler";
import { DevtoolsPluginOptions, EmitableCustomEvents } from "./devtools.types";

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
    plugin.data.eventHandler?.sendEvent("customEvent")(
      EmitableCustomEvents.REQUEST_CREATED,
      plugin.data.requests,
      true,
    );
  });

  return plugin;
};
