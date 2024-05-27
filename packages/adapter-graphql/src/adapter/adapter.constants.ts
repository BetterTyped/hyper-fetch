import { Time } from "@hyper-fetch/core";

import { GraphQlExtraType } from "./adapter.types";

export const defaultTimeout = Time.SEC * 5;

export const gqlExtra: GraphQlExtraType = {
  headers: {},
};
