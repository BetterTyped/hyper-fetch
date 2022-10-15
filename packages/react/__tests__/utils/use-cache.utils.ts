import { CommandInstance } from "@hyper-fetch/core";
import { renderHook } from "@testing-library/react";

import { useCache, UseCacheOptionsType } from "hooks/use-cache";

export const renderUseCache = <T extends CommandInstance>(command: T, options?: UseCacheOptionsType<T>) => {
  return renderHook((rerenderOptions: UseCacheOptionsType<CommandInstance> & { command?: CommandInstance }) => {
    const { command: cmd, ...rest } = rerenderOptions || {};
    return useCache(cmd || command, { dependencyTracking: false, ...options, ...rest });
  });
};
