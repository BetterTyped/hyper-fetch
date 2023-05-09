import * as browser from "@browser-adapter";
import * as server from "@server-adapter";

import { AdapterType } from "adapter";

export const adapter: AdapterType = async (request, requestId) => {
  if (typeof XMLHttpRequest !== "undefined") {
    return browser.adapter(request, requestId);
  }
  return server.adapter(request, requestId);
};
