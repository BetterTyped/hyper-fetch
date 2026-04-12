import { getGqlAdapter } from "./http-adapter.fetch";
import type { GraphqlAdapterType } from "./adapter.types";

export const GraphqlAdapter = (): GraphqlAdapterType => {
  return getGqlAdapter();
};
