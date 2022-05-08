import { FetchBuilder } from "@better-typed/hyper-fetch";

export const builder = new FetchBuilder({ baseUrl: "http://localhost:5000" })
  .setLoggerLevel(["error", "success", "warning", "http", "info", "debug"])
  .setDebug(true);

export const publicApiBuilder = new FetchBuilder({ baseUrl: "https://www.boredapi.com/api/activity" })
  .setLoggerLevel(["error", "success", "warning", "http", "info", "debug"])
  .setDebug(true);
