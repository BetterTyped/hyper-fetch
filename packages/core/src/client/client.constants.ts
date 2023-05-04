import { AdapterAdditionalDataType } from "adapter";

export const stringifyDefaultOptions = {
  strict: true,
  encode: true,
  arrayFormat: "bracket",
  arraySeparator: "",
  sort: false,
  skipNull: true,
  skipEmptyString: true,
} as const;

export const xhrAdditionalData: AdapterAdditionalDataType = {
  headers: {},
};
