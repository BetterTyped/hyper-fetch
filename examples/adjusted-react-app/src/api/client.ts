import { Client } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import { DevtoolsPlugin } from "@hyper-fetch/devtools-plugin";

export const client = new Client({ url: "http://localhost:5000" }).setDebug(true).addPlugin((instance) =>
  DevtoolsPlugin(instance, {
    socketPort: 1234,
    appName: "ADJUSTED_REACT_APP",
  }),
);
export const socket = new Socket({ url: "ws://localhost:5050", autoConnect: false }).setDebug(true);
