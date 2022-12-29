import { RequestInstance } from "@hyper-fetch/core";
import { renderHook } from "@testing-library/react";

import { useCache, UseCacheOptionsType } from "hooks/use-cache";

export const renderUseCache = <T extends RequestInstance>(request: T, options?: UseCacheOptionsType<T>) => {
  return renderHook((rerenderOptions: UseCacheOptionsType<RequestInstance> & { request?: RequestInstance }) => {
    const { request: cmd, ...rest } = rerenderOptions || {};
    return useCache(cmd || request, { dependencyTracking: false, ...options, ...rest });
  });
};
