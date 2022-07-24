import { useState, useRef } from "react";
import { CommandInstance, getCommandDispatcher, DispatcherDumpValueType } from "@better-typed/hyper-fetch";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import { UseQueueOptionsType, useQueueDefaultOptions, QueueRequest, UseQueueReturnType } from "use-queue";
import { useConfigProvider } from "config-provider";

/**
 * This hook allows to control dispatchers request queues
 * @param command
 * @param options
 * @returns
 */
export const useQueue = <Command extends CommandInstance>(
  command: Command,
  options: UseQueueOptionsType = useQueueDefaultOptions,
): UseQueueReturnType<Command> => {
  // Build the configuration options
  const [globalConfig] = useConfigProvider();
  const { queueType } = {
    ...useQueueDefaultOptions,
    ...globalConfig.useQueueConfig,
    ...options,
  };

  const { abortKey, queueKey, builder } = command;
  const { commandManager } = builder;

  const [dispatcher] = getCommandDispatcher(command, queueType);

  const unmountCallbacks = useRef<null | VoidFunction>(null);

  const [stopped, setStopped] = useState(false);
  const [requests, setRequests] = useState<QueueRequest<Command>[]>([]);

  // ******************
  // Mapping
  // ******************

  const createRequestsArray = (queueElements: DispatcherDumpValueType<Command>[]): QueueRequest<Command>[] => {
    return queueElements.map<QueueRequest<Command>>((req) => ({
      ...req,
      stopRequest: () => dispatcher.stopRequest(queueKey, req.requestId),
      startRequest: () => dispatcher.startRequest(queueKey, req.requestId),
      deleteRequest: () => dispatcher.delete(queueKey, req.requestId, abortKey),
    }));
  };

  const mergeRequestData = (requestId: string, data: Partial<QueueRequest<Command>>) => {
    setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, ...data } : el)));
  };

  // ******************
  // State
  // ******************

  const getInitialState = () => {
    const commandQueue = dispatcher.getQueue<Command>(queueKey);

    setStopped(commandQueue.stopped);
    setRequests(createRequestsArray(commandQueue.requests));
  };

  const updateQueueState = (values: { requests: QueueRequest<Command>[]; stopped: boolean }) => {
    setStopped(values.stopped);
    setRequests(createRequestsArray(values.requests));
  };

  // ******************
  // Events
  // ******************

  const mountEvents = () => {
    const unmountChange = dispatcher.events.onQueueChange<Command>(queueKey, updateQueueState);
    const unmountStatus = dispatcher.events.onQueueStatus<Command>(queueKey, updateQueueState);

    const unmountDownload = commandManager.events.onDownloadProgress(queueKey, (progress, { requestId }) => {
      mergeRequestData(requestId, { downloading: progress });
    });

    const unmountUpload = commandManager.events.onUploadProgress(queueKey, (progress, { requestId }) => {
      mergeRequestData(requestId, { uploading: progress });
    });

    const unmount = () => {
      unmountStatus();
      unmountChange();
      unmountDownload();
      unmountUpload();
    };

    unmountCallbacks.current?.();
    unmountCallbacks.current = unmount;
    return unmount;
  };

  // ******************
  // Lifecycle
  // ******************

  useDidMount(getInitialState);

  useDidUpdate(mountEvents, [stopped, requests, setRequests, setStopped], true);

  return {
    stopped,
    requests,
    stop: () => dispatcher.stop(queueKey),
    pause: () => dispatcher.pause(queueKey),
    start: () => dispatcher.start(queueKey),
  };
};
