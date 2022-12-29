import { RequestInstance } from "@hyper-fetch/core";
import { renderHook } from "@testing-library/react";

import { useFetch, UseFetchOptionsType } from "hooks/use-fetch";

export const renderUseFetch = <T extends RequestInstance>(request: T, options?: UseFetchOptionsType<T>) => {
  return renderHook((rerenderOptions: UseFetchOptionsType<RequestInstance> & { request?: RequestInstance }) => {
    const { request: cmd, ...rest } = rerenderOptions || {};
    return useFetch(cmd || request, { dependencyTracking: false, ...options, ...rest });
  });
};
