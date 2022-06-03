import { FetchCommandInstance } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";

import { useFetch, UseFetchOptionsType } from "use-fetch";

export const renderUseFetch = <T extends FetchCommandInstance>(command: T, options?: UseFetchOptionsType<T>) => {
  return renderHook(() => useFetch(command, { dependencyTracking: false, ...options }));
};
