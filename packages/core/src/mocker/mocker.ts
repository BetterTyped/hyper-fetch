import type { getAdapterBindings, AdapterInstance } from "adapter";
import { RequestProcessingError } from "adapter";
import type { ExtractAdapterExtraType, ExtractAdapterStatusType } from "types";

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

  const { data, error, status, extra = request.client.adapter.defaultExtra } = result;
  // Without the `success` flag, a mock with nothing but an error is a failed response
  const hasData = data !== undefined && data !== null;
  const { success = !error || hasData } = result;

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
      const dataStart = Date.now();
      const intervals = Math.ceil(totalTime / interval);
      const chunkSize = Math.ceil(totalSize / intervals);
      let currentlyLoaded = 0;
      const timer = setInterval(function handleProgressInterval() {
        // Aborted or timed out - nothing more is transferred
        if (thrown) {
          resolveProgress(true);
          clearInterval(timer);
          return;
        }

        const currentTime = Math.min(totalTime, Date.now() - dataStart);
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

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (typeof timeout === "number") {
    timeoutId = setTimeout(() => {
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
  clearTimeout(timeoutId);
  // An abort or a timeout was already reported when it happened
  if (thrown) {
    return;
  }
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
  onResponseEnd();
};
