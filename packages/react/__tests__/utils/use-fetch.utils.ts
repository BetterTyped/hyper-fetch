import type { RequestInstance } from "@hyper-fetch/core";
import { renderHook } from "@testing-library/react";

import type { UseFetchOptionsType } from "hooks/use-fetch";
import { useFetch } from "hooks/use-fetch";

export const renderUseFetch = <T extends RequestInstance>(request: T, options?: UseFetchOptionsType<T>) => {
  return renderHook((rerenderOptions: UseFetchOptionsType<RequestInstance> & { request?: RequestInstance }) => {
    const { request: req, ...rest } = rerenderOptions || {};
    return useFetch(req || request, { dependencyTracking: false, ...options, ...rest } as UseFetchOptionsType<T>);
  });
};
