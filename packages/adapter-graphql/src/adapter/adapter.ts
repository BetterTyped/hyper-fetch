import * as browser from "@browser-adapter";
import * as server from "@server-adapter";

import { GraphqlAdapterType } from "./adapter.types";

export const GraphqlAdapter = (): GraphqlAdapterType => {
  if (typeof XMLHttpRequest !== "undefined") {
    return browser.getGqlAdapter();
  }
  return server.getGqlAdapter();
};
