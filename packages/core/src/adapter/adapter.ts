import * as browser from "@browser-adapter";
import * as server from "@server-adapter";

import { AdapterType } from "adapter";

export const adapter: AdapterType = async (request, requestId) => {
  if (typeof XMLHttpRequest !== "undefined") {
    return browser.adapter(request, requestId);
  }
  if (typeof process !== "undefined" && Object.prototype.toString.call(process) === "[object process]") {
    return server.adapter(request, requestId);
  }
  return (() => {
    return [null, new Error("Cannot find the right environment for http adapter"), 0];
  }) as unknown as ReturnType<AdapterType>;
};
