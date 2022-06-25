import { CommandInstance } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";

import { useSubmit, UseSubmitOptionsType } from "use-submit";

export const renderUseSubmit = <T extends CommandInstance>(command: T, options?: UseSubmitOptionsType<T>) => {
  return renderHook(() => useSubmit(command, { dependencyTracking: false, ...options }));
};
