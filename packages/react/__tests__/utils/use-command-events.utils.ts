import { CommandInstance } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";

import { useTrackedState, useCommandEvents, UseCommandEventsPropsType, UseTrackedStateProps } from "helpers";
import { isEqual } from "utils";

export const renderUseCommandEvents = <Command extends CommandInstance>(
  command: Command,
  options?: UseCommandEventsPropsType<Command>,
  trackedOptions?: UseTrackedStateProps<Command>,
) => {
  const { builder } = command;
  const { fetchDispatcher: dispatcher, loggerManager } = builder;

  const logger = loggerManager.init("test");

  const { result } = renderHook(() => {
    return useTrackedState({
      logger,
      command,
      dispatcher,
      initialData: null,
      deepCompare: isEqual,
      dependencyTracking: false,
      ...trackedOptions,
    });
  });
  const [, actions, { setCacheData }] = result.current;

  return renderHook(() => {
    return useCommandEvents({ logger, actions, command, dispatcher, setCacheData, ...options });
  });
};
