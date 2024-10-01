import { ClientInstance } from "@hyper-fetch/core";

import { DevtoolsEventEmitter } from "./devtools.event.emitter";
import { DevtoolsPluginOptions } from "./devtools.types";
import { addOnCreateRequestEvent } from "./devtools.injections";

export const DevtoolsPlugin = <T extends ClientInstance>(client: T, options: DevtoolsPluginOptions) => {
  const logger = client.loggerManager.init("DevtoolsPlugin");
  const requestCreatedEventEmitter = addOnCreateRequestEvent(client);
  DevtoolsEventEmitter.initialize(client, options, requestCreatedEventEmitter);
  logger.info(`Successfully initialized devtools plugin`);

  return client;
};
