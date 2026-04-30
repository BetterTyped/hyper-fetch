import type { GraphqlAdapterType } from "./adapter.types";
import { getGqlAdapter } from "./http-adapter.fetch";

export const GraphqlAdapter = (): GraphqlAdapterType => {
  return getGqlAdapter();
};
