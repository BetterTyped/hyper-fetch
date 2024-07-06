import { RequestInstance } from "../request";
import { getAdapterBindings, AdapterInstance, AdapterType, ResponseType } from "adapter";

export const mocker = async <T extends AdapterInstance = AdapterType>(
  request: RequestInstance,
  {
    onError,
    onResponseEnd,
    onTimeoutError,
    onRequestEnd,
    createAbortListener,
    onResponseProgress,
    onRequestProgress,
    onResponseStart,
    onBeforeRequest,
    onRequestStart,
    onSuccess,
  }: Pick<
    Awaited<ReturnType<typeof getAdapterBindings<T>>>,
    | "onError"
    | "onResponseEnd"
    | "onTimeoutError"
    | "onRequestEnd"
    | "createAbortListener"
    | "onResponseProgress"
    | "onRequestProgress"
    | "onResponseStart"
    | "onBeforeRequest"
    | "onRequestStart"
    | "onSuccess"
  >,
) => {
  if (!request.mock) {
    throw new Error("[Internal HF Error] mock should be defined when calling mocker");
  }
  const mock = request.mock.next();
  const result = mock.value instanceof Function ? await mock.value(request) : mock.value;

  return new Promise<ResponseType<any, any, any>>((resolve) => {
    const { data, status = 200, success = true, extra, config } = result;
    const {
      requestTime = 20,
      responseTime = 20,
      totalUploaded = 1,
      totalDownloaded = 1,
      timeout = false,
    } = config || {};

    createAbortListener(0 as any, {} as any, () => {}, resolve);

    onBeforeRequest();
    onRequestStart();

    const progress = (
      totalTime: number,
      totalSize: number,
      progressFunction: typeof onResponseProgress | typeof onRequestProgress,
    ) =>
      new Promise((resolveProgress) => {
        const interval = 20;
        const dataStart = +new Date();
        const chunkSize = Math.floor(totalSize / Math.floor(totalTime / Math.min(totalTime, interval)));
        let currentlyLoaded = 0;
        const timer = setInterval(function handleProgressInterval() {
          const currentTime = Math.min(totalTime, +new Date() - dataStart);
          currentlyLoaded += currentlyLoaded + chunkSize >= totalSize ? totalSize - currentlyLoaded : chunkSize;
          if (currentTime >= totalTime) {
            resolveProgress(true);
            clearInterval(timer);
          } else {
            progressFunction({
              total: totalSize,
              loaded: currentlyLoaded,
            });
          }
        }, interval);
      });

    const getResponse = async () => {
      await progress(requestTime, totalUploaded, onRequestProgress);
      onRequestEnd();
      onResponseStart();
      await progress(responseTime, totalDownloaded, onResponseProgress);
      if (success) {
        onSuccess(data, status as any, extra || {}, resolve);
      } else {
        onError(data, status as any, extra || {}, resolve);
      }
    };

    if (timeout) {
      setTimeout(() => onTimeoutError(0 as any, extra || {}, resolve), 1);
    } else {
      setTimeout(getResponse, requestTime + responseTime + 1);
    }

    onResponseEnd();
  });
};
