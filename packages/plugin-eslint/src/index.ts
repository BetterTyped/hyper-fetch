import { clientGenericTypes } from "client-generic-types";
import { requestGenericTypes } from "./request-generic-types/request-generic-types";

export const configs = {
  recommended: {
    plugins: ["hyper-fetch"],
    rules: {
      "hyper-fetch/request-generic-types": "error",
      "hyper-fetch/client-generic-types": "error",
    },
  },
};

export const rules = {
  "request-generic-types": requestGenericTypes,
  "client-generic-types": clientGenericTypes,
};
