import { RequestInstance } from "../request";
import { getAdapterBindings } from "./adapter.bindings";
import { BaseAdapterType } from "./adapter.types";

export const handleMockRequest = async <T extends RequestInstance>(
  resolve,
  request: T,
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
  }: Omit<Awaited<ReturnType<typeof getAdapterBindings<T, BaseAdapterType>>>, "requestWrapper">,
) => {
  const timeout = request.requestOptions.options?.timeout;
  const mock = request.mock.next();
  const result = mock.value instanceof Function ? await mock.value(request) : mock.value;
  const { data, config = {} } = result;
  const { status = 200, responseDelay = 5, requestSentDuration = 0, responseReceivedDuration = 0 } = config;
  const calculateDurations = () => {
    if (timeout && requestSentDuration + responseReceivedDuration > timeout) {
      return [Math.floor(timeout / 2) - 1, Math.floor(timeout / 2) - 1];
    }
    return [requestSentDuration, responseReceivedDuration];
  };
  const [adjustedRequestSentDuration, adjustedResponseReceivedDuration] = calculateDurations();

  // TODO - should we adjust for firebase and non-number status in this release?
  const isSuccess = status < 400;

  createAbortListener(0, {}, () => {}, resolve);

  onBeforeRequest();
  onRequestStart();

  const progress = (total, progressFunction: typeof onResponseProgress | typeof onRequestProgress) =>
    new Promise((resolveProgress) => {
      const dataStart = +new Date();

      setInterval(() => {
        const currentTime = +new Date();
        const currentLoaded = Math.min(total, currentTime - dataStart);
        if (currentLoaded >= total) {
          resolveProgress(true);
        }
        progressFunction({
          total,
          loaded: currentLoaded,
        });
      }, 20);
    });

  const getResponse = async () => {
    await progress(adjustedRequestSentDuration, onRequestProgress);
    onRequestEnd();
    onResponseStart();
    await progress(adjustedResponseReceivedDuration, onResponseProgress);
    if (isSuccess) {
      onSuccess(data, status, {}, resolve);
    } else {
      onError(data, status, {}, resolve);
    }
  };

  if (timeout && responseDelay > timeout) {
    setTimeout(() => onTimeoutError(0, {}, resolve), timeout + 1);
  } else {
    setTimeout(getResponse, responseDelay);
  }

  onResponseEnd();
};
