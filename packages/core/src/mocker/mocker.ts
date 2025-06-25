import { getAdapterBindings, AdapterInstance, RequestProcessingError } from "adapter";
import { ExtractAdapterExtraType, ExtractAdapterStatusType } from "types";

export const mocker = async <T extends AdapterInstance>({
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
  onAbortError,
  adapter,
}: Awaited<ReturnType<typeof getAdapterBindings<T>>>) => {
  if (!request.unstable_mock) {
    throw new RequestProcessingError("Mock should be defined when calling mocker");
  }

  let thrown = false;

  const {
    requestTime = 20,
    responseTime = 20,
    totalUploaded = 1000,
    totalDownloaded = 1000,
    timeout,
  } = request.unstable_mock.config;
  const result = await request.unstable_mock.fn({ request, requestId });

  const { data, error, status, success = true, extra = request.client.adapter.defaultExtra } = result;

  createAbortListener({
    status: adapter.systemErrorStatus,
    extra: adapter.systemErrorExtra,
    onAbort: () => {
      thrown = true;
    },
  });

  onBeforeRequest();
  onRequestStart();

  const progress = (
    totalTime: number,
    totalSize: number,
    progressFunction: typeof onResponseProgress | typeof onRequestProgress,
  ) =>
    new Promise((resolveProgress) => {
      if (thrown) {
        resolveProgress(true);
        return;
      }

      const interval = 20;
      const dataStart = +new Date();
      const intervals = Math.ceil(totalTime / interval);
      const chunkSize = Math.ceil(totalSize / intervals);
      let currentlyLoaded = 0;
      const timer = setInterval(function handleProgressInterval() {
        if (thrown) {
          resolveProgress(true);
          clearInterval(timer);
        }

        const currentTime = Math.min(totalTime, +new Date() - dataStart);
        currentlyLoaded += currentlyLoaded + chunkSize >= totalSize ? totalSize - currentlyLoaded : chunkSize;
        progressFunction({
          total: totalSize,
          loaded: currentTime >= totalTime ? totalSize : currentlyLoaded,
        });

        if (currentTime >= totalTime) {
          resolveProgress(true);
          clearInterval(timer);
        }
      }, interval);
    });

  if (typeof timeout === "number") {
    setTimeout(() => {
      thrown = true;
      onTimeoutError({
        status: 0 as ExtractAdapterStatusType<T>,
        extra: extra as ExtractAdapterExtraType<T>,
      });
    }, timeout);
  }
  if (!thrown) {
    await progress(requestTime, totalUploaded, onRequestProgress);
  }
  if (!thrown) {
    onRequestEnd();
    onResponseStart();
  }
  if (!thrown) {
    await progress(responseTime, totalDownloaded, onResponseProgress);
  }
  if (thrown) {
    onAbortError({
      status: adapter.systemErrorStatus,
      extra: adapter.systemErrorExtra,
    });
  } else if (success || (error && data)) {
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
  if (!thrown) {
    onResponseEnd();
  }
};
