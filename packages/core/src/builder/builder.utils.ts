import {
  ClientQueryParam,
  ClientQueryParamsType,
  ClientQueryParamValues,
  ClientResponseType,
  QueryStringifyOptions,
} from "client";
import { CommandInstance } from "command";
import { stringifyDefaultOptions } from "builder";
import { NegativeTypes } from "types";
import { RequestInterceptorCallback, ResponseInterceptorCallback } from "./builder.types";

// Utils

export const stringifyValue = (response: string | unknown): string => {
  try {
    return JSON.stringify(response as string);
  } catch (err) {
    return "";
  }
};

export const interceptRequest = async (interceptors: RequestInterceptorCallback[], command: CommandInstance) => {
  let newCommand = command;
  if (!command.commandOptions.disableRequestInterceptors) {
    // eslint-disable-next-line no-restricted-syntax
    for (const interceptor of interceptors) {
      // eslint-disable-next-line no-await-in-loop
      newCommand = (await interceptor(command)) as CommandInstance;
      if (!newCommand) throw new Error("Request modifier must return command");
    }
  }
  return newCommand;
};

export const interceptResponse = async <GlobalErrorType>(
  interceptors: ResponseInterceptorCallback[],
  response: ClientResponseType<any, GlobalErrorType>,
  command: CommandInstance,
) => {
  let newResponse = response;
  if (!command.commandOptions.disableResponseInterceptors) {
    // eslint-disable-next-line no-restricted-syntax
    for (const interceptor of interceptors) {
      // eslint-disable-next-line no-await-in-loop
      newResponse = await interceptor(response, command);
      if (!newResponse) throw new Error("Response modifier must return data");
    }
  }
  return newResponse;
};
// Mappers

export const getClientHeaders = (command: CommandInstance) => {
  const isFormData = command.data instanceof FormData;
  const headers: HeadersInit = {};

  if (!isFormData) headers["Content-Type"] = "application/json";

  Object.assign(headers, command.headers);
  return headers as HeadersInit;
};

export const getClientPayload = (data: unknown): string | FormData => {
  const isFormData = data instanceof FormData;
  if (isFormData) return data;

  return stringifyValue(data);
};

// Stringify

const isValidValue = (options: QueryStringifyOptions) => {
  return (value: ClientQueryParam) => {
    const { skipNull, skipEmptyString } = options;

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
  };
};

const encodeValue = (value: string, { encode, strict }: Pick<QueryStringifyOptions, "encode" | "strict">): string => {
  if (encode && strict) {
    return encodeURIComponent(value).replace(/[!'()*]/g, (s) => `%${s.charCodeAt(0).toString(16).toUpperCase()}`);
  }
  if (encode) {
    return encodeURIComponent(value);
  }
  return value;
};

const encodeParams = (key: string, value: ClientQueryParam, options: QueryStringifyOptions) => {
  const shouldSkip = !isValidValue(options)(value);

  if (!key || shouldSkip) {
    return "";
  }

  return `${encodeValue(key, options)}=${encodeValue(String(value), options)}`;
};

const encodeArray = (key: string, array: Array<ClientQueryParamValues>, options: QueryStringifyOptions): string => {
  const { arrayFormat, arraySeparator } = options;

  return array
    .filter(isValidValue(options))
    .reduce<string[]>((acc, value, index) => {
      switch (arrayFormat) {
        case "index": {
          const keyValue = `${encodeValue(key, options)}[${encodeValue(String(index), options)}]=`;
          acc.push(`${keyValue}${encodeValue(String(value), options)}`);
          break;
        }
        case "bracket": {
          const keyValue = `${encodeValue(key, options)}[]=`;
          acc.push(`${keyValue}${encodeValue(String(value), options)}`);
          break;
        }
        case "comma": {
          const keyValue = (!acc.length && `${encodeValue(key, options)}=`) || "";
          return [[...acc, `${keyValue}${encodeValue(String(value), options)}`].join(",")];
        }
        case "separator": {
          const keyValue = (!acc.length && `${encodeValue(key, options)}=`) || "";
          return [[...acc, `${keyValue}${encodeValue(String(value), options)}`].join(arraySeparator || "|")];
        }
        case "bracket-separator": {
          const keyValue = (!acc.length && `${encodeValue(key, options)}[]=`) || "";
          return [[...acc, `${keyValue}${encodeValue(String(value), options)}`].join(arraySeparator || "|")];
        }
        default: {
          const keyValue = `${encodeValue(key, options)}=`;
          acc.push(`${keyValue}${encodeValue(String(value), options)}`);
        }
      }

      return acc;
    }, [])
    .join("&");
};

export const stringifyQueryParams = (
  queryParams: ClientQueryParamsType | string | NegativeTypes,
  options: QueryStringifyOptions = stringifyDefaultOptions,
): string => {
  if (!queryParams || !Object.keys(queryParams).length) {
    return "";
  }

  if (typeof queryParams === "string") {
    const hasQuestionMark = queryParams[0] === "?";
    return hasQuestionMark ? queryParams : `?${queryParams}`;
  }

  const stringified = Object.entries(queryParams)
    .map(([key, value]): string => {
      if (Array.isArray(value)) {
        return encodeArray(key, value, options);
      }

      return encodeParams(key, value, options);
    })
    .filter(Boolean)
    .join("&");

  if (stringified) {
    return `?${stringified}`;
  }
  return "";
};
