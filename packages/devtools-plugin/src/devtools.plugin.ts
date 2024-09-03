import { ClientInstance } from "@hyper-fetch/core";

import { DevtoolsEventEmitter } from "./devtools.event.emitter";
import { DevtoolsPluginOptions } from "./devtools.types";
import { addOnCreateRequestEvent } from "./devtools.injections";

export const devtoolsPluginFunc = <T extends ClientInstance>(client: T, metaData: DevtoolsPluginOptions) => {
  const requestCreatedEventEmitter = addOnCreateRequestEvent(client);
  DevtoolsEventEmitter.initialize(client, metaData, requestCreatedEventEmitter);
  const logger = client.loggerManager.init("DevtoolsPlugin");
  logger.info(`Successfully initialized devtools plugin`);

  return client;
};
