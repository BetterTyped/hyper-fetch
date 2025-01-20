import { Client } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";

export const client = new Client({ url: "http://localhost:5000" }).setDebug(true).setLogLevel("debug");

export const socket = new Socket({ url: "ws://localhost:5050", autoConnect: false }).setDebug(true);
