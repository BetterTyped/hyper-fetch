import { Plugin, RequestInstance } from "@hyper-fetch/core";

import { DevtoolsEventEmitter } from "./devtools.event.emitter";
import { DevtoolsPluginOptions, EmitableCustomEvents } from "./devtools.types";

export const devtoolsPlugin = (options: DevtoolsPluginOptions) => {
  const plugin = new Plugin({
    name: "devtools-plugin",
    data: {
      emitter: undefined as DevtoolsEventEmitter | undefined,
      requests: [] as RequestInstance[],
    },
  });

  plugin.onMount(({ client }) => {
    plugin.data.emitter = new DevtoolsEventEmitter(client, options);
  });

  plugin.onRequestCreate(({ request }) => {
    plugin.data.requests.push(request);
    plugin.data.emitter?.sendEvent(EmitableCustomEvents.REQUEST_CREATED, plugin.data.requests);
  });

  return plugin;
};
