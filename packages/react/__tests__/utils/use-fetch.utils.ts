import { CommandInstance } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";

import { useFetch, UseFetchOptionsType } from "use-fetch";

export const renderUseFetch = <T extends CommandInstance>(command: T, options?: UseFetchOptionsType<T>) => {
  return renderHook(() => useFetch(command, { dependencyTracking: false, ...options }));
};
