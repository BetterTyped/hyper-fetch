import { getAdapterBindings, AdapterInstance, RequestProcessingError } from "adapter";
import { ExtractAdapterExtraType, ExtractAdapterStatusType } from "types";

export const mocker = async <T extends AdapterInstance>({
  bindings: {
    request,
    requestId,
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
  bindings: Awaited<ReturnType<typeof getAdapterBindings<T>>>;
  systemErrorStatus: ExtractAdapterStatusType<T>;
  systemErrorExtra: ExtractAdapterExtraType<T>;
}) => {
  if (!request.unsafe_mock) {
    throw new RequestProcessingError("Mock should be defined when calling mocker");
  }

  const {
    requestTime = 20,
    responseTime = 20,
    totalUploaded = 1,
    totalDownloaded = 1,
    timeout = false,
  } = request.unsafe_mock.config;
  const result = await request.unsafe_mock.fn({ request, requestId });

  const { data, error, status, success = true, extra = request.client.defaultExtra } = result;

  createAbortListener({ status: systemErrorStatus, extra: systemErrorExtra, onAbort: () => {} });

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
    if (success || (error && data)) {
      onSuccess({
        data,
        error,
        status: status as ExtractAdapterStatusType<T>,
        extra: extra as ExtractAdapterExtraType<T>,
      });
    } else {
      onError({
        error,
        status: status as ExtractAdapterStatusType<T>,
        extra: extra as ExtractAdapterExtraType<T>,
      });
    }
  };

  if (timeout) {
    setTimeout(
      () =>
        onTimeoutError({
          status: 0 as ExtractAdapterStatusType<T>,
          extra: extra as ExtractAdapterExtraType<T>,
        }),
      1,
    );
  } else {
    setTimeout(getResponse, requestTime + responseTime + 1);
  }

  onResponseEnd();
};
