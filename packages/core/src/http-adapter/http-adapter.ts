import type { HttpAdapterType } from "http-adapter/http-adapter.types";

import { getAdapter } from "./http-adapter.fetch";

export const HttpAdapter = (): HttpAdapterType => {
  return getAdapter();
};
