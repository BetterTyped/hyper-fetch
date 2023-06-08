import { DateInterval } from "constants/time.constants";
import { AdapterExtraType } from "./adapter.types";

export const defaultTimeout = DateInterval.second * 5;

export const xhrExtra: AdapterExtraType = {
  headers: {},
};
