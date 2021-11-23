import { ClientResponseErrorType, ClientResponseSuccessType } from "client";
import { ClientProgressEvent, FetchMiddlewareInstance, getProgressData } from "middleware";
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

export const getResponseError = (errorCase?: "timeout" | "abort") => {
  if (errorCase === "timeout") {
    return new Error("Request timeout");
  }
  if (errorCase === "abort") {
    return new Error("Request cancelled");
  }
  return new Error("Something went wrong");
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
  const requestOptions = { ...middleware.builderConfig.options, ...middleware.apiConfig.options };

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
  event: ClientProgressEvent,
): void => {
  const progress = getProgressData(new Date(startDate), event);

  middleware.responseProgressCallback?.(progress);
};

export const setRequestProgress = <T extends FetchMiddlewareInstance>(
  middleware: T,
  startDate: number,
  event: ClientProgressEvent,
): void => {
  const progress = getProgressData(new Date(startDate), event);

  middleware.requestProgressCallback?.(progress);
};

// Client response handlers

export const handleClientError = async <T extends FetchMiddlewareInstance>(
  middleware: T,
  resolve: (data: ClientResponseErrorType<ExtractError<T>>) => void,
  event?: ProgressEvent<XMLHttpRequest>,
  errorCase?: "timeout" | "abort",
): Promise<void> => {
  if (!event?.target && !errorCase) {
    return;
  }

  let status = 0;
  let error: Error | ExtractError<T> | ExtractMappedError<T> = getResponseError(errorCase);

  if (event?.target && !errorCase) {
    status = event.target.status;
    const { response } = event.target;
    error = getErrorResponse(middleware, response);
  }

  const responseData = [null, error, status] as ClientResponseErrorType<ExtractError<T>>;

  await middleware.builderConfig.onResponseCallbacks(middleware, responseData);
  middleware.onErrorCallback?.(responseData, middleware);
  middleware.onFinishedCallback?.(responseData, middleware);
  resolve(responseData);
};

export const handleClientSuccess = async <T extends FetchMiddlewareInstance>(
  middleware: T,
  event: ProgressEvent<XMLHttpRequest>,
  resolve: (data: ClientResponseSuccessType<ExtractResponse<T>>) => void,
): Promise<void> => {
  if (!event.target) return;

  const { status } = event.target;

  const data = parseResponse(event.target?.response);

  const responseData = [data, null, status] as ClientResponseSuccessType<ExtractResponse<T>>;

  await middleware.builderConfig.onResponseCallbacks(middleware, responseData);
  middleware.onSuccessCallback?.(responseData, middleware);
  middleware.onFinishedCallback?.(responseData, middleware);
  resolve(responseData);
};
