import { FetchCommandInstance } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";

import { useFetch, UseFetchOptionsType } from "use-fetch";
import { waitForRender } from "./helpers.utils";

export const renderUseFetch = async <T extends FetchCommandInstance>(command: T, options?: UseFetchOptionsType<T>) => {
  const hook = renderHook(() => useFetch(command, { dependencyTracking: false, ...options }));
  await waitForRender();
  return hook;
};
