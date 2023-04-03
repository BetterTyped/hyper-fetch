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
    // TODO
    // onResponseProgress,
    // onRequestProgress,
    onResponseStart,
    onBeforeRequest,
    onRequestStart,
    onSuccess,
  }: Omit<Awaited<ReturnType<typeof getAdapterBindings<T, BaseAdapterType>>>, "requestWrapper">,
) => {
  let data = {};
  let status;
  let responseDelay;
  let timeout;

  const mock = request.mock.next();
  if (mock.value instanceof Function) {
    ({ data, config: { status = 200, responseDelay = 5, timeout = false } = {} } = await mock.value(request));
  } else {
    ({
      value: { data, config: { status = 200, responseDelay = 5, timeout = false } = {} },
    } = mock);
  }

  const isSuccess = status < 400;
  // Listen to abort signal
  createAbortListener(0, {}, () => {}, resolve);

  onBeforeRequest();
  onRequestStart();

  const getResponse = () => {
    if (isSuccess) {
      onRequestEnd();
      onResponseStart();
      onSuccess(data, status, {}, resolve);
    } else {
      onRequestEnd();
      onResponseStart();
      onError(data, status, {}, resolve);
    }
  };

  if (timeout && responseDelay) {
    setTimeout(() => onTimeoutError(0, {}, resolve), responseDelay);
  } else {
    setTimeout(getResponse, responseDelay);
  }

  onResponseEnd();
};
