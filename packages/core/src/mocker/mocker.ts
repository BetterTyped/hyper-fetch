import { RequestInstance } from "../request";
import { getAdapterBindings, AdapterInstance, AdapterType, ResponseReturnType } from "adapter";

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
  const timeout = request.requestOptions.options?.timeout || request.options?.timeout;
  const mock = request.mock.next();
  const result = mock.value instanceof Function ? await mock.value(request) : mock.value;

  return new Promise<ResponseReturnType<any, any, any>>((resolve) => {
    const { data, config = {}, extra } = result;
    const {
      status = 200,
      success = true,
      responseDelay = 5,
      requestSentDuration = 0,
      responseReceivedDuration = 0,
    } = config;
    const calculateDurations = () => {
      if (timeout && requestSentDuration + responseReceivedDuration > timeout) {
        return [Math.floor(timeout / 2) - 1, Math.floor(timeout / 2) - 1];
      }
      return [requestSentDuration, responseReceivedDuration];
    };
    const [adjustedRequestSentDuration, adjustedResponseReceivedDuration] = calculateDurations();

    createAbortListener(0 as any, {} as any, () => {}, resolve);

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
      if (success) {
        onSuccess(data, status as any, extra || {}, resolve);
      } else {
        onError(data, status as any, extra || {}, resolve);
      }
    };

    if (timeout && responseDelay > timeout) {
      setTimeout(() => onTimeoutError(0 as any, extra || {}, resolve), timeout + 1);
    } else {
      setTimeout(getResponse, responseDelay);
    }

    onResponseEnd();
  });
};
