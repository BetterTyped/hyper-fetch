import { CommandInstance } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";

import { useSubmit, UseSubmitOptionsType } from "hooks/use-submit";

export const renderUseSubmit = <T extends CommandInstance>(command: T, options?: UseSubmitOptionsType<T>) => {
  return renderHook((rerenderOptions: UseSubmitOptionsType<CommandInstance> & { command?: CommandInstance }) => {
    const { command: cmd, ...rest } = rerenderOptions || {};
    return useSubmit(cmd || command, { dependencyTracking: false, ...options, ...rest });
  });
};
