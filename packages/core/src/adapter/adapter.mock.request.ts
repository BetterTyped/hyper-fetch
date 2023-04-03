import { RequestInstance, RequestMockType } from "../request";
import { getAdapterBindings } from "./adapter.bindings";
import { BaseAdapterType } from "./adapter.types";

export const handleMockRequest = <T extends RequestInstance>(
  resolve,
  requestMock: any,
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
  console.log("HERE", requestMock);
  const {
    value: { data, config: { status = 200, responseDelay = 5, timeout = false } = {} },
  } = requestMock.next();
  console.log("PRINTING", data, status, responseDelay);
  const isSuccess = status < 400;
  // Listen to abort signal
  createAbortListener(0, {}, () => {}, resolve);

  onBeforeRequest();
  onRequestStart();

  const getResponse = () => {
    if (isSuccess) {
      onSuccess(data, 200, {}, resolve);
    } else {
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
