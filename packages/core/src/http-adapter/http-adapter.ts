import * as browser from "@browser-adapter";
import * as server from "@server-adapter";
import { FetchAdapter } from "./fetch-adapter";

import { HttpAdapterType } from "http-adapter/http-adapter.types";

export const HttpAdapter = (): HttpAdapterType => {
  if (typeof XMLHttpRequest !== "undefined") {
    return browser.getAdapter();
  }
  return server.getAdapter();
};

/**
 * Fetch-based HTTP adapter that works in both browser and server environments
 * Uses the native fetch API instead of XMLHttpRequest or Node.js http modules
 */
export const FetchHttpAdapter = (): HttpAdapterType => {
  return FetchAdapter();
};
