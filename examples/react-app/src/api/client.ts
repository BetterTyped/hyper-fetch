import { Client } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import { devtoolsPlugin } from "@hyper-fetch/devtools-plugin";

export const client = new Client({ url: "http://localhost:5000" })
  .addPlugin(devtoolsPlugin({ appName: "react-app" }))
  .setDebug(true)
  .setLogLevel("debug");

export const socket = new Socket({ url: "ws://localhost:5050", adapterOptions: { autoConnect: false } }).setDebug(true);
