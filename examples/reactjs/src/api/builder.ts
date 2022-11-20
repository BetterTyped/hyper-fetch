import { Builder } from "@hyper-fetch/core";

export const builder = new Builder({ url: "http://localhost:5000" }).setLoggerSeverity(2).setDebug(true);
