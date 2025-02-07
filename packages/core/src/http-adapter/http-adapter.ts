import * as browser from "@browser-adapter";
import * as server from "@server-adapter";

import { HttpAdapterType } from "http-adapter/http-adapter.types";

export const httpAdapter: HttpAdapterType = (() => {
  if (typeof XMLHttpRequest !== "undefined") {
    return browser.httpAdapter;
  }
  return server.httpAdapter;
})();
