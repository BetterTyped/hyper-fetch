import { ClientInstance } from "@hyper-fetch/core";

import { DevtoolsManager } from "./devtools.manager";
import { DevtoolsPluginOptions } from "./devtools.types";

export const devtoolsPluginFunc = <T extends ClientInstance>(client: T, metaData: DevtoolsPluginOptions) => {
  DevtoolsManager.initialize(client, metaData);
  const logger = client.loggerManager.init("DevtoolsPlugin");
  logger.info(`Successfully initialized devtools plugin`);

  return client;
};
