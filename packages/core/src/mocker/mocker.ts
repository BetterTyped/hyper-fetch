import type { getAdapterBindings, AdapterInstance } from "adapter";
import { RequestProcessingError } from "adapter";
import type { ExtractAdapterExtraType, ExtractAdapterStatusType } from "types";

const joinChunks = (chunks: (string | Uint8Array)[]): unknown => {
  const decoder = new TextDecoder();
  const text =
    chunks.map((chunk) => (typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true }))).join("") +
    decoder.decode();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const mocker = async <T extends AdapterInstance>({
  request,
  requestId,
  onError,
  onResponseEnd,
  onTimeoutError,
  onRequestEnd,
  createAbortListener,
  onResponseProgress,
  onResponseChunk,
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
    chunkTime = 0,
  } = request.unstable_mock.config;
  const result = await request.unstable_mock.fn({ request, requestId });

  const { error, status, success = true, extra = request.client.adapter.defaultExtra } = result;
  const { chunks } = result as { chunks?: (string | Uint8Array)[] };
  let { data } = result as { data?: unknown };

  if (chunks && data === undefined) {
    data = joinChunks(chunks);
  }

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
        if (thrown) {
          resolveProgress(true);
          clearInterval(timer);
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
  if (chunks) {
    for (const chunk of chunks) {
      if (thrown) {
        break;
      }
      if (chunkTime > 0) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolveChunk) => {
          setTimeout(resolveChunk, chunkTime);
        });
      }
      if (thrown) {
        break;
      }
      onResponseChunk(chunk);
    }
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
