import { CommandInstance, getCommandDispatcher } from "@better-typed/hyper-fetch";
import { renderHook } from "@testing-library/react";

import { useQueue, UseQueueOptionsType } from "use-queue";

export const renderUseQueue = <T extends CommandInstance>(command: T, options?: UseQueueOptionsType) => {
  return renderHook((rerenderOptions: UseQueueOptionsType & { command?: CommandInstance }) => {
    const { command: cmd, ...rest } = rerenderOptions || {};
    return useQueue(cmd || command, { ...options, ...rest });
  });
};

export const addQueueElement = <T extends CommandInstance>(
  command: T,
  options?: {
    stop: boolean;
    queueType?: "fetch" | "submit" | "auto";
  },
) => {
  const { stop = false, queueType = "auto" } = options || {};
  const [dispatcher] = getCommandDispatcher(command, queueType);
  if (stop) dispatcher.stop(command.queueKey);
  return dispatcher.add(command);
};
