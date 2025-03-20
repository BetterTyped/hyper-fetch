import * as browser from "@browser-adapter";
import * as server from "@server-adapter";

import { GraphQLAdapterType } from "./adapter.types";

export const GraphqlAdapter = (): GraphQLAdapterType => {
  if (typeof XMLHttpRequest !== "undefined") {
    return browser.getGqlAdapter();
  }
  return server.getGqlAdapter();
};
