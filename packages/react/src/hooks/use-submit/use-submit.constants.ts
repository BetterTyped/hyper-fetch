import { RequestInstance, RequiredKeys } from "@hyper-fetch/core";

import { UseSubmitOptionsType } from "./use-submit.types";

type DefaultOptionsType = RequiredKeys<Omit<UseSubmitOptionsType<RequestInstance>, "initialResponse">> & {
  initialResponse: null;
};

export const useSubmitDefaultOptions: DefaultOptionsType = {
  disabled: false,
  dependencyTracking: true,
  initialResponse: null,
  bounce: false,
  bounceType: "debounce",
  bounceTime: 400,
  deepCompare: true,
};
