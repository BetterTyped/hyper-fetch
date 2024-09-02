import { ClientInstance } from "@hyper-fetch/core";

import { DevtoolsEventEmitter } from "./devtools.event.emitter";
import { DevtoolsPluginOptions } from "./devtools.types";

export const devtoolsPluginFunc = <T extends ClientInstance>(client: T, metaData: DevtoolsPluginOptions) => {
  DevtoolsEventEmitter.initialize(client, metaData);
  const logger = client.loggerManager.init("DevtoolsPlugin");
  logger.info(`Successfully initialized devtools plugin`);

  return client;
};
