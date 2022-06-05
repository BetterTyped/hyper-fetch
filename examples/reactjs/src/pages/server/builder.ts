import { Builder } from "@better-typed/hyper-fetch";

export const builder = new Builder({ baseUrl: "http://localhost:5000" })
  .setLoggerLevel(["error", "success", "warning", "http", "info", "debug"])
  .setDebug(true);

export const publicApiBuilder = new Builder({ baseUrl: "https://www.boredapi.com/api/activity" })
  .setLoggerLevel(["error", "success", "warning", "http", "info", "debug"])
  .setDebug(true);
