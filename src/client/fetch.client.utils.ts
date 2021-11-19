import { ClientResponseErrorType, ClientResponseSuccessType } from "client";
import { FetchMiddlewareInstance, getProgressData } from "middleware";
import { ExtractError, ExtractMappedError, ExtractResponse } from "types";

export type ClientHeadersProps = {
  isFormData: boolean;
  headers: HeadersInit | undefined;
};

export const parseResponse = (response: string | unknown) => {
  try {
    return JSON.parse(response as string);
  } catch (err) {
    return response;
  }
};

export const stringifyPayload = (response: string | unknown): string => {
  try {
    return JSON.stringify(response as string);
  } catch (err) {
    console.error("Error while trying to stringify payload.");
    return "";
  }
};

// Client data handlers

export const setClientHeaders = <T extends FetchMiddlewareInstance>(middleware: T, xhr: XMLHttpRequest): void => {
  const isFormData = middleware.data instanceof FormData;
  const headers: HeadersInit = {};

  if (!isFormData) headers["Content-Type"] = "application/json";

  Object.assign(headers, middleware.headers);
  Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
};

export const setClientOptions = <T extends FetchMiddlewareInstance>(middleware: T, xhr: XMLHttpRequest): void => {
  const requestOptions = middleware.apiConfig.options || {};

  Object.entries(requestOptions).forEach(([name, value]) => {
    // eslint-disable-next-line no-param-reassign
    (xhr as any)[name] = value;
  });
};

export const getClientPayload = (data: unknown): string | FormData => {
  const isFormData = data instanceof FormData;
  if (!isFormData) return stringifyPayload(data);

  return data;
};

export const getErrorResponse = <T extends FetchMiddlewareInstance>(
  middleware: T,
  response: unknown,
): ExtractError<T> | ExtractMappedError<T> => {
  const error: ExtractError<T> = parseResponse(response) || { message: "Request failed" };

  return middleware.builderConfig?.onErrorCallback?.(error) || error;
};

export const setResponseProgress = <T extends FetchMiddlewareInstance>(
  middleware: T,
  startDate: number,
  event: ProgressEvent<XMLHttpRequest>,
): void => {
  const progress = getProgressData(new Date(startDate), event);

  middleware.responseProgressCallbacks?.forEach((callback) => callback(progress));
};

export const setRequestProgress = <T extends FetchMiddlewareInstance>(
  middleware: T,
  startDate: number,
  event: ProgressEvent<XMLHttpRequest>,
): void => {
  const progress = getProgressData(new Date(startDate), event);

  middleware.requestProgressCallbacks?.forEach((callback) => callback(progress));
};

// Client response handlers

export const handleClientError = <T extends FetchMiddlewareInstance>(
  middleware: T,
  event: ProgressEvent<XMLHttpRequest>,
  resolve: (data: ClientResponseErrorType<ExtractError<T>>) => void,
): void => {
  if (!event.target) return;

  const { status, response } = event.target;

  const error = getErrorResponse(middleware, response);

  const responseData = [null, error, status] as ClientResponseErrorType<ExtractError<T>>;

  middleware.onErrorCallbacks?.forEach((callback) => callback(responseData, middleware));
  middleware.onFinishedCallbacks?.forEach((callback) => callback(responseData, middleware));
  resolve(responseData);
};

export const handleClientSuccess = <T extends FetchMiddlewareInstance>(
  middleware: T,
  event: ProgressEvent<XMLHttpRequest>,
  resolve: (data: ClientResponseSuccessType<ExtractResponse<T>>) => void,
): void => {
  if (!event.target) return;

  const { status } = event.target;

  const data = parseResponse(event.target);

  const responseData = [data, null, status] as ClientResponseSuccessType<ExtractResponse<T>>;

  middleware.onSuccessCallbacks?.forEach((callback) => callback(responseData, middleware));
  middleware.onFinishedCallbacks?.forEach((callback) => callback(responseData, middleware));
  resolve(responseData);
};
