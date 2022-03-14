import { useState, useRef } from "react";
import { FetchCommandInstance, getCommandQueue } from "@better-typed/hyper-fetch";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import { UseQueueOptions, useQueueDefaultOptions, QueueRequest } from "use-queue";

export const useQueue = <Command extends FetchCommandInstance>(
  command: Command,
  options: UseQueueOptions = useQueueDefaultOptions,
) => {
  const { queueType = useQueueDefaultOptions.queueType } = options;
  const { queueKey, builder } = command;
  const { commandManager } = builder;

  const queueRef = useRef(getCommandQueue(command, queueType));

  const unmountCallbacks = useRef<null | VoidFunction>(null);

  const [connecting, setConnected] = useState(true);
  const [stopped, setStopped] = useState(false);
  const [requests, setRequests] = useState<QueueRequest<Command>[]>([]);

  const getInitialState = async () => {
    const queue = queueRef.current;
    const commandQueue = await queue.get<Command>(queueKey);

    setStopped(commandQueue.stopped);
    setRequests(commandQueue.requests);
    setConnected(false);
  };

  const mountEvents = () => {
    const queue = queueRef.current;
    const unmountChange = queue.events.onQueueChange<Command>(queueKey, (values) => {
      setStopped(values.stopped);
      setRequests([...values.requests]);
    });

    const unmountDownload = commandManager.events.onDownloadProgress(queueKey, (progress, { requestId }) => {
      setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, downloading: progress } : el)));
    });

    const unmountUpload = commandManager.events.onDownloadProgress(queueKey, (progress, { requestId }) => {
      setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, uploading: progress } : el)));
    });

    const unmountStatus = queue.events.onQueueStatus(queueKey, (values) => {
      setStopped(values.stopped);
      setRequests([...values.requests]);
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

  useDidMount(() => {
    getInitialState();
  });

  useDidUpdate(
    () => {
      return mountEvents();
    },
    [stopped, requests, setRequests, setStopped],
    true,
  );

  return {
    connecting,
    stopped,
    requests,
    stopQueue: () => queueRef.current.stopQueue(queueKey),
    pauseQueue: () => queueRef.current.pauseQueue(queueKey),
    startQueue: () => queueRef.current.startQueue(queueKey),
  };
};
