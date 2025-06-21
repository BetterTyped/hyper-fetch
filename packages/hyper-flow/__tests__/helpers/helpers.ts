import { Client } from "@hyper-fetch/core";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";
import { Socket } from "@hyper-fetch/sockets";

import { ConnectionName } from "@/constants/connection.name";

export const connectDevtoolsClient = ({
  baseUrl = "http://localhost:2137",
  clientName = "test-client",
  socketAddress = "ws:localhost",
  socketPort = 2137,
}: {
  baseUrl?: string;
  clientName?: string;
  socketAddress?: string;
  socketPort?: number;
} = {}) => {
  const client = new Client({ url: baseUrl });

  const plugin = DevtoolsPlugin({
    appName: clientName,
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
    .setQueryParams({ connectionName: ConnectionName.HF_DEVTOOLS_FRONTEND });

  await initSocket.connect();
  return initSocket;
};
