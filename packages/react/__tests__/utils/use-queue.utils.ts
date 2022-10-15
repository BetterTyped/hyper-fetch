import { renderHook } from "@testing-library/react";
import { CommandInstance, getCommandDispatcher, getProgressData } from "@hyper-fetch/core";

import { useQueue, UseQueueOptionsType } from "hooks/use-queue";

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

export const emitDownloadProgress = <T extends CommandInstance>(
  requestId: string,
  command: T,
  options?: {
    total: number;
    loaded: number;
  },
) => {
  const values = options || { total: 50, loaded: 25 };
  const startTimestamp = new Date(+new Date() - 20000);
  const progressTimestamp = new Date();

  const progress = getProgressData(startTimestamp, progressTimestamp, values);
  command.builder.commandManager.events.emitDownloadProgress(command.queueKey, requestId, progress, {
    requestId,
    command,
  });

  return [startTimestamp, progressTimestamp];
};

export const emitUploadProgress = <T extends CommandInstance>(
  requestId: string,
  command: T,
  options?: {
    total: number;
    loaded: number;
  },
) => {
  const values = options || { total: 50, loaded: 25 };
  const startTimestamp = new Date(+new Date() - 20000);
  const progressTimestamp = new Date();

  const progress = getProgressData(startTimestamp, progressTimestamp, values);
  command.builder.commandManager.events.emitUploadProgress(command.queueKey, requestId, progress, {
    requestId,
    command,
  });

  return [startTimestamp, progressTimestamp];
};
