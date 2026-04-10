import { getAdapter } from "./http-adapter.fetch";
import { HttpAdapterType } from "http-adapter/http-adapter.types";

export const HttpAdapter = (): HttpAdapterType => {
  return getAdapter();
};
