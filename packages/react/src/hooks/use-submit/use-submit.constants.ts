import { CommandInstance, RequiredKeys } from "@hyper-fetch/core";

import { UseSubmitOptionsType } from "./use-submit.types";

type DefaultOptionsType = RequiredKeys<Omit<UseSubmitOptionsType<CommandInstance>, "initialData">> & {
  initialData: null;
};

export const useSubmitDefaultOptions: DefaultOptionsType = {
  disabled: false,
  dependencyTracking: true,
  initialData: null,
  bounce: false,
  bounceType: "debounce",
  bounceTime: 400,
  deepCompare: true,
};
