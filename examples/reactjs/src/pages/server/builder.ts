import { FetchBuilder } from "@better-typed/hyper-fetch";

export const builder = new FetchBuilder({ baseUrl: "http://localhost:5000" })
  .setLoggerLevel(["error", "success", "warning", "http", "info", "debug"])
  // .setDebug(true)
  .build();
