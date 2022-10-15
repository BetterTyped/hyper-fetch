import { Builder } from "@hyper-fetch/core";

export const builder = new Builder({ baseUrl: "http://localhost:5000" }).setLoggerSeverity(2).setDebug(true);
