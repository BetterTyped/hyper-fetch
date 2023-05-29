import { DateInterval } from "@hyper-fetch/core";

import { GraphQlExtraType } from "./adapter.types";

export const defaultTimeout = DateInterval.second * 5;

export const gqlExtra: GraphQlExtraType = {
  headers: {},
};
