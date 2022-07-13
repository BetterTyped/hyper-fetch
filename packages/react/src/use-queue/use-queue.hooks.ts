import { useState, useRef } from "react";
import { CommandInstance, getCommandDispatcher, DispatcherDumpValueType } from "@better-typed/hyper-fetch";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import { UseQueueOptionsType, useQueueDefaultOptions, QueueRequest, UseQueueReturnType } from "use-queue";

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
  const { queueType = useQueueDefaultOptions.queueType } = options;
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
      stopRequest: () => dispatcher[0].stopRequest(queueKey, req.requestId),
      startRequest: () => dispatcher[0].startRequest(queueKey, req.requestId),
      deleteRequest: () => dispatcher[0].delete(queueKey, req.requestId, abortKey),
    }));
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
      setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, downloading: progress } : el)));
    });

    const unmountUpload = commandManager.events.onUploadProgress(queueKey, (progress, { requestId }) => {
      setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, uploading: progress } : el)));
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
    stop: () => dispatcher[0].stop(queueKey),
    pause: () => dispatcher[0].pause(queueKey),
    start: () => dispatcher[0].start(queueKey),
  };
};
