import { Client } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import { devtoolsPlugin } from "@hyper-fetch/devtools-plugin";

export const client = new Client({ url: "http://localhost:5000" }).setDebug(true).addPlugin(
  devtoolsPlugin({
    appName: "Adjusted app",
    socketPort: 1234,
  }),
);
export const socket = new Socket({ url: "ws://localhost:5050", autoConnect: false }).setDebug(true);
