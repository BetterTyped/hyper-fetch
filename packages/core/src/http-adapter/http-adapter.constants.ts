import { Time } from "constants/time.constants";
import type { HttpAdapterExtraType } from "./http-adapter.types";

export const defaultTimeout = Time.SEC * 5;

export const xhrExtra: HttpAdapterExtraType = {
  headers: {},
};
