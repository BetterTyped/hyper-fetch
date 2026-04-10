import { getGqlAdapter } from "./http-adapter.fetch";
import { GraphqlAdapterType } from "./adapter.types";

export const GraphqlAdapter = (): GraphqlAdapterType => {
  return getGqlAdapter();
};
