import { Time } from "constants/time.constants";
import { AdapterExtraType } from "./adapter.types";

export const defaultTimeout = Time.SEC * 5;

export const xhrExtra: AdapterExtraType = {
  headers: {},
};
