import { RequestInstance } from "../request";
import {
  getAdapterBindings,
  AdapterInstance,
  AdapterType,
  ResponseType,
  ExtractAdapterExtraType,
  ExtractAdapterStatusType,
} from "adapter";

export const mocker = async <T extends AdapterInstance = AdapterType>({
  request,
  callbacks: {
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
  },
  systemErrorStatus,
  systemErrorExtra,
}: {
  request: RequestInstance;
  callbacks: Pick<
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
  >;
  systemErrorStatus: ExtractAdapterStatusType<T>;
  systemErrorExtra: ExtractAdapterExtraType<T>;
}) => {
  if (!request.mock) {
    throw new Error("[Internal HF Error] mock should be defined when calling mocker");
  }
  const {
    requestTime = 20,
    responseTime = 20,
    totalUploaded = 1,
    totalDownloaded = 1,
    timeout = false,
  } = request.mock.config;
  const result = await request.mock.fn({ request });

  return new Promise<ResponseType<any, any, AdapterType>>((resolve) => {
    const { data, status, success = true, extra = request.client.defaultExtra } = result;

    createAbortListener(systemErrorStatus, systemErrorExtra, () => {}, resolve);

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
        onSuccess(data, status as ExtractAdapterStatusType<T>, extra as ExtractAdapterExtraType<T>, resolve);
      } else {
        onError(data, status as ExtractAdapterStatusType<T>, extra as ExtractAdapterExtraType<T>, resolve);
      }
    };

    if (timeout) {
      setTimeout(
        () => onTimeoutError(0 as ExtractAdapterStatusType<T>, extra as ExtractAdapterExtraType<T>, resolve),
        1,
      );
    } else {
      setTimeout(getResponse, requestTime + responseTime + 1);
    }

    onResponseEnd();
  });
};
