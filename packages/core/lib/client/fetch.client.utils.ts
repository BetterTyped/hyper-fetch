import { ClientQueryParamsType, ClientQueryParamValues, QueryStringifyOptions, stringifyDefaultOptions } from "client";
import { ClientProgressEvent, FetchCommandInstance, getProgressData } from "command";
import { ExtractError, NegativeTypes } from "types";

// Client data handlers

export const stringifyPayload = (response: string | unknown): string => {
  try {
    return JSON.stringify(response as string);
  } catch (err) {
    console.error("Error while trying to stringify payload.");
    return "";
  }
};

export const getClientHeaders = (command: FetchCommandInstance) => {
  const isFormData = command.data instanceof FormData;
  const headers: HeadersInit = {};

  if (!isFormData) headers["Content-Type"] = "application/json";

  Object.assign(headers, command.headers);
  return headers as HeadersInit;
};

export const getRequestConfig = <T extends Record<string, unknown> = Record<string, unknown>>(
  command: FetchCommandInstance,
): T => {
  return { ...command.builder.requestConfig, ...command.commandOptions.options };
};

export const getClientPayload = (data: unknown): string | FormData => {
  const isFormData = data instanceof FormData;
  if (!isFormData) return stringifyPayload(data);

  return data;
};

export const getErrorMessage = (errorCase?: "timeout" | "abort") => {
  if (errorCase === "timeout") {
    return new Error("Request timeout");
  }
  if (errorCase === "abort") {
    return new Error("Request cancelled");
  }
  return new Error("Unexpected error");
};

// Responses

export const parseResponse = (response: string | unknown) => {
  try {
    return JSON.parse(response as string);
  } catch (err) {
    return response;
  }
};

export const parseErrorResponse = <T extends FetchCommandInstance>(response: unknown): ExtractError<T> => {
  return parseResponse(response) || getErrorMessage();
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

export const encodeParams = (
  queryParams: ClientQueryParamsType | string | NegativeTypes,
  options: QueryStringifyOptions = stringifyDefaultOptions,
): string => {
  if (!queryParams || !Object.keys(queryParams)?.length) {
    return "";
  }

  if (typeof queryParams === "string") {
    return queryParams[0] === "?" ? queryParams : `?${queryParams}`;
  }

  const stringified = Object.entries(queryParams)
    .map(([key, value]): string => {
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

// Progress

export const setResponseProgress = <T extends FetchCommandInstance>(
  queueKey: string,
  requestId: string,
  command: T,
  startDate: number,
  event: ClientProgressEvent,
): void => {
  const progress = getProgressData(new Date(startDate), event);

  command.builder.commandManager.events.emitDownloadProgress(queueKey, progress, { requestId, command });
};

export const setRequestProgress = <T extends FetchCommandInstance>(
  queueKey: string,
  requestId: string,
  command: T,
  startDate: number,
  event: ClientProgressEvent,
): void => {
  const progress = getProgressData(new Date(startDate), event);

  command.builder.commandManager.events.emitUploadProgress(queueKey, progress, { requestId, command });
};
