import { CommandInstance } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";

import { useFetch, UseFetchOptionsType } from "use-fetch";

export const renderUseFetch = <T extends CommandInstance>(command: T, options?: UseFetchOptionsType<T>) => {
  return renderHook((rerenderOptions: UseFetchOptionsType<CommandInstance> & { command?: CommandInstance }) => {
    const { command: cmd, ...rest } = rerenderOptions || {};
    return useFetch(cmd || command, { dependencyTracking: false, ...options, ...rest });
  });
};
