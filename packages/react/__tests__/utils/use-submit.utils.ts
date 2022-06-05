import { CommandInstance } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";

import { useSubmit, UseSubmitOptionsType } from "use-submit";
import { waitForRender } from "./helpers.utils";

export const renderUseSubmit = async <T extends CommandInstance>(command: T, options?: UseSubmitOptionsType<T>) => {
  const hook = renderHook(() => useSubmit(command, { dependencyTracking: false, ...options }));
  await waitForRender();
  return hook;
};
