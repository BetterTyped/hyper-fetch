import { Client } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";

export const client = new Client({ url: "http://localhost:5000" }).setDebug(true).addPlugin(
  DevtoolsPlugin({
    appName: "React App",
  }),
);
export const socket = new Socket({ url: "ws://localhost:5050" }).setDebug(true);
