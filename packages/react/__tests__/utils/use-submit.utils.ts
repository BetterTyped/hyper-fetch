import type { RequestInstance } from "@hyper-fetch/core";
import { renderHook } from "@testing-library/react";

import type { UseSubmitOptionsType } from "hooks/use-submit";
import { useSubmit } from "hooks/use-submit";

export const renderUseSubmit = <T extends RequestInstance>(request: T, options?: UseSubmitOptionsType<T>) => {
  return renderHook((rerenderOptions: UseSubmitOptionsType<T> & { request?: T }) => {
    const { request: cmd, ...rest } = rerenderOptions || {};
    return useSubmit(cmd || request, { dependencyTracking: false, ...options, ...rest });
  });
};
