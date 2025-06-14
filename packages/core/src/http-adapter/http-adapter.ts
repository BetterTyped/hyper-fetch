import * as browser from "@browser-adapter";
import * as server from "@server-adapter";

import { HttpAdapterType } from "http-adapter/http-adapter.types";

export const HttpAdapter = (): HttpAdapterType => {
  if (typeof XMLHttpRequest !== "undefined") {
    return browser.getAdapter();
  }
  return server.getAdapter();
};
