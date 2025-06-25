import { createClient, ClientInstance } from "@hyper-fetch/core";
import { DevtoolsPlugin, MessageOrigin } from "@hyper-fetch/plugin-devtools";
import { Socket } from "@hyper-fetch/sockets";

import { ConnectionName } from "@/constants/connection.name";

const defaultClient = createClient({ url: "http://localhost:2137" });

export const connectDevtoolsClient = ({
  client = defaultClient,
  appName = "test-client",
  socketAddress = "localhost",
  socketPort = 2137,
}: {
  client?: ClientInstance;
  appName?: string;
  socketAddress?: string;
  socketPort?: number;
} = {}) => {
  const plugin = DevtoolsPlugin({
    appName,
    url: `ws://${socketAddress}:${socketPort}`,
  });

  client.addPlugin(plugin);

  return { client, plugin };
};

export const connectDevtoolsFrontend = async ({
  socketAddress = "localhost",
  socketPort = 2137,
}: {
  socketAddress?: string;
  socketPort?: number;
}) => {
  const initSocket = new Socket({
    url: `ws://${socketAddress}:${socketPort}`,
    adapterOptions: { autoConnect: false },
  })
    .setDebug(true)
    .setQueryParams({ connectionName: ConnectionName.HF_DEVTOOLS_FRONTEND, origin: MessageOrigin.APP });

  await initSocket.connect();
  return initSocket;
};
