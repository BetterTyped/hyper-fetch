import { CommandInstance } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";

import { useTrackedState, UseTrackedStateProps } from "helpers";
import { isEqual } from "utils";

export const renderUseTrackedState = <Command extends CommandInstance>(
  command: Command,
  options?: Partial<UseTrackedStateProps<Command>>,
) => {
  const { builder } = command;
  const { fetchDispatcher: dispatcher, loggerManager } = builder;

  const logger = loggerManager.init("test");
  return renderHook(() => {
    return useTrackedState({
      logger,
      command,
      dispatcher,
      initialData: null,
      deepCompare: isEqual,
      dependencyTracking: false,
      ...options,
    });
  });
};
