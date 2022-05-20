import { useState, useRef } from "react";
import {
  DispatcherDumpValueType,
  ExtractClientOptions,
  FetchCommandInstance,
  getCommandDispatcher,
} from "@better-typed/hyper-fetch";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import { UseQueueOptions, useQueueDefaultOptions, QueueRequest } from "use-queue";

export const useQueue = <Command extends FetchCommandInstance>(
  command: Command,
  options: UseQueueOptions = useQueueDefaultOptions,
) => {
  const { queueType = useQueueDefaultOptions.queueType } = options;
  const { queueKey, builder } = command;
  const { commandManager } = builder;

  const dispatcher = getCommandDispatcher(command, queueType);

  const unmountCallbacks = useRef<null | VoidFunction>(null);

  const [connecting, setConnected] = useState(true);
  const [stopped, setStopped] = useState(false);
  const [requests, setRequests] = useState<QueueRequest<Command>[]>([]);

  // ******************
  // Mapping
  // ******************

  const createRequestsArray = (
    queueElements: DispatcherDumpValueType<ExtractClientOptions<Command>, Command>[],
  ): QueueRequest<Command>[] => {
    return queueElements.map<QueueRequest<Command>>((req) => ({
      ...req,
      stopRequest: () => dispatcher[0].stopRequest(queueKey, req.requestId),
      startRequest: () => dispatcher[0].startRequest(queueKey, req.requestId),
      deleteRequest: () => dispatcher[0].delete(queueKey, req.requestId),
    }));
  };

  // ******************
  // State
  // ******************

  const getInitialState = () => {
    const [queue] = dispatcher;
    const commandQueue = queue.getQueue<Command>(queueKey);

    setStopped(commandQueue.stopped);
    setRequests(createRequestsArray(commandQueue.requests));
    setConnected(false);
  };

  // ******************
  // Events
  // ******************

  const mountEvents = () => {
    const [queue] = dispatcher;
    const unmountChange = queue.events.onQueueChange<Command>(queueKey, (values) => {
      setStopped(values.stopped);
      setRequests(createRequestsArray(values.requests));
    });

    const unmountDownload = commandManager.events.onDownloadProgress(queueKey, (progress, { requestId }) => {
      setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, downloading: progress } : el)));
    });

    const unmountUpload = commandManager.events.onDownloadProgress(queueKey, (progress, { requestId }) => {
      setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, uploading: progress } : el)));
    });

    const unmountStatus = queue.events.onQueueStatus(queueKey, (values) => {
      setStopped(values.stopped);
      setRequests(createRequestsArray(values.requests));
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
    connecting,
    stopped,
    requests,
    stop: () => dispatcher[0].stop(queueKey),
    pause: () => dispatcher[0].pause(queueKey),
    start: () => dispatcher[0].start(queueKey),
  };
};
