import { Client } from "@hyper-fetch/core";

export const client = new Client({ url: "http://localhost:5000" }).setDebug(true);
