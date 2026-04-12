import { getAdapter } from "./http-adapter.fetch";
import type { HttpAdapterType } from "http-adapter/http-adapter.types";

export const HttpAdapter = (): HttpAdapterType => {
  return getAdapter();
};
