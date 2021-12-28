import {
  ClientQueryParamsType,
  ClientQueryParamValues,
  ClientResponseErrorType,
  ClientResponseSuccessType,
  QueryStringifyOptions,
  stringifyDefaultOptions,
} from "client";
import { ClientProgressEvent, FetchCommandInstance, getProgressData } from "command";
import { ExtractError, ExtractMappedError, ExtractResponse, NegativeTypes } from "types";
import { getCacheKey } from "cache";

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

// Stringify

export const encodeQuery = (
  value: string,
  { encode, strict }: Pick<QueryStringifyOptions, "encode" | "strict">,
): string => {
  if (encode && strict) {
    return encodeURIComponent(value).replace(/[!'()*]/g, (s) => `%${s.charCodeAt(0).toString(16).toUpperCase()}`);
  }
  if (encode) {
    return encodeURIComponent(value);
  }
  return value;
};

export const encodeArray = (
  key: string,
  array: Array<ClientQueryParamValues>,
  options: QueryStringifyOptions,
): string => {
  const { arrayFormat, arraySeparator, skipNull, skipEmptyString } = options;

  function isValidValue(value: ClientQueryParamValues) {
    if (skipEmptyString && value === undefined) {
      return false;
    }
    if (skipEmptyString && value === "") {
      return false;
    }
    if (skipNull && value === null) {
      return false;
    }
    return true;
  }

  return array
    .filter(isValidValue)
    .reduce<string[]>((acc, curr, index) => {
      const value = curr === null ? "" : curr;

      if (arrayFormat === "index") {
        const keyValue = `${encodeQuery(key, options)}[${encodeQuery(String(index), options)}]=`;
        acc.push(`${keyValue}${encodeQuery(String(value), options)}`);
      } else if (arrayFormat === "bracket") {
        const keyValue = `${encodeQuery(key, options)}[]=`;
        acc.push(`${keyValue}${encodeQuery(String(value), options)}`);
      } else if (arrayFormat === "comma") {
        const keyValue = (!acc.length && `${encodeQuery(key, options)}=`) || "";
        return [[...acc, `${keyValue}${encodeQuery(String(value), options)}`].join(",")];
      } else if (arrayFormat === "separator") {
        const keyValue = (!acc.length && `${encodeQuery(key, options)}=`) || "";
        return [[...acc, `${keyValue}${encodeQuery(String(value), options)}`].join(arraySeparator || "|")];
      } else if (arrayFormat === "bracket-separator") {
        const keyValue = (!acc.length && `${encodeQuery(key, options)}[]=`) || "";
        return [[...acc, `${keyValue}${encodeQuery(String(value), options)}`].join(arraySeparator || "|")];
      } else {
        const keyValue = `${encodeQuery(key, options)}=`;
        acc.push(`${keyValue}${encodeQuery(String(value), options)}`);
      }

      return acc;
    }, [])
    .join("&");
};

export const stringifyQueryParams = (
  queryParams: ClientQueryParamsType | string | NegativeTypes,
  options: QueryStringifyOptions = stringifyDefaultOptions,
): string => {
  if (!queryParams || !Object.keys(queryParams)?.length) {
    return "";
  }

  if (typeof queryParams === "string") {
    return `?${queryParams}`;
  }

  const stringified = Object.entries(queryParams)
    .map(([key, value]): string => {
      if (!value) {
        return "";
      }

      if (Array.isArray(value)) {
        return encodeArray(key, value, options);
      }

      return `${encodeQuery(key, options)}=${encodeQuery(String(value), options)}`;
    })
    .filter(Boolean)
    .join("&");

  if (stringified) {
    return `?${stringified}`;
  }
  return "";
};

// Client data handlers

export const setClientHeaders = <T extends FetchCommandInstance>(
  command: T,
  xhr: XMLHttpRequest,
  mapper?: (command: T, xhr: XMLHttpRequest) => void,
): void => {
  if (mapper) {
    return mapper(command, xhr);
  }

  const isFormData = command.data instanceof FormData;
  const headers: HeadersInit = {};

  if (!isFormData) headers["Content-Type"] = "application/json";

  Object.assign(headers, command.headers);
  Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
};

export const setClientOptions = <T extends FetchCommandInstance>(command: T, xhr: XMLHttpRequest): void => {
  const requestOptions = { ...command.builder.options, ...command.commandOptions.options };

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

export const getErrorResponse = <T extends FetchCommandInstance>(
  command: T,
  response: unknown,
): ExtractError<T> | ExtractMappedError<T> => {
  const error: ExtractError<T> = parseResponse(response) || { message: "Request failed" };

  return command.builder?.onErrorCallback?.(error) || error;
};

export const setResponseProgress = <T extends FetchCommandInstance>(
  command: T,
  startDate: number,
  event: ClientProgressEvent,
): void => {
  const progress = getProgressData(new Date(startDate), event);

  command.builder.commandManager.events.emitDownloadProgress(getCacheKey(command), progress);
};

export const setRequestProgress = <T extends FetchCommandInstance>(
  command: T,
  startDate: number,
  event: ClientProgressEvent,
): void => {
  const progress = getProgressData(new Date(startDate), event);

  command.builder.commandManager.events.emitUploadProgress(getCacheKey(command), progress);
};

// Client response handlers

export const handleClientError = async <T extends FetchCommandInstance>(
  command: T,
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
    error = getErrorResponse(command, response);
  }

  const responseData = [null, error, status] as ClientResponseErrorType<ExtractError<T>>;

  await command.builder.modifyResponse(responseData, command);
  resolve(responseData);
};

export const handleClientSuccess = async <T extends FetchCommandInstance>(
  command: T,
  event: ProgressEvent<XMLHttpRequest>,
  resolve: (data: ClientResponseSuccessType<ExtractResponse<T>>) => void,
): Promise<void> => {
  if (!event.target) return;

  const { status } = event.target;

  const data = parseResponse(event.target?.response);

  const responseData = [data, null, status] as ClientResponseSuccessType<ExtractResponse<T>>;

  await command.builder.modifyResponse(responseData, command);
  resolve(responseData);
};
