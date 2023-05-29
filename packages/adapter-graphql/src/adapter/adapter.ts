import * as browser from "@browser-adapter";
import * as server from "@server-adapter";
import { AdapterType, HttpMethodsEnum } from "@hyper-fetch/core";

export const graphqlAdapter: AdapterType = async (request, requestId) => {
  request.client.setDefaultMethod(HttpMethodsEnum.post);

  if (typeof XMLHttpRequest !== "undefined") {
    return browser.adapter(request, requestId);
  }
  return server.adapter(request, requestId);
};
