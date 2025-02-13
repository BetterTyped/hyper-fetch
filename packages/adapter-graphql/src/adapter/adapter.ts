import * as browser from "adapter/http-adapter.browser";
import * as server from "adapter/http-adapter.server";
import { GraphQLAdapterType } from "./adapter.types";

export const GraphqlAdapter = (): GraphQLAdapterType => {
  if (typeof XMLHttpRequest !== "undefined") {
    return browser.getGqlAdapter();
  }
  return server.getGqlAdapter();
};
