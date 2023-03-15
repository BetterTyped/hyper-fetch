import {
  QueryParamType,
  QueryParamsType,
  QueryParamValuesType,
  ResponseReturnType,
  QueryStringifyOptionsType,
  BaseAdapterType,
} from "adapter";
import { RequestInstance } from "request";
import { stringifyDefaultOptions } from "client";
import { NegativeTypes } from "types";
import { RequestInterceptorType, ResponseInterceptorType } from "./client.types";

// Utils

export const stringifyValue = (response: string | unknown): string => {
  try {
    return JSON.stringify(response as string);
  } catch (err) {
    return "";
  }
};

export const interceptRequest = async (interceptors: RequestInterceptorType[], request: RequestInstance) => {
  let newRequest = request;
  if (!request.requestOptions.disableRequestInterceptors) {
    // eslint-disable-next-line no-restricted-syntax
    for (const interceptor of interceptors) {
      // eslint-disable-next-line no-await-in-loop
      newRequest = (await interceptor(request)) as RequestInstance;
      if (!newRequest) throw new Error("Request modifier must return request");
    }
  }
  return newRequest;
};

export const interceptResponse = async <GlobalErrorType, AdapterType extends BaseAdapterType>(
  interceptors: ResponseInterceptorType[],
  response: ResponseReturnType<any, GlobalErrorType, AdapterType>,
  request: RequestInstance,
) => {
  let newResponse = response;
  if (!request.requestOptions.disableResponseInterceptors) {
    // eslint-disable-next-line no-restricted-syntax
    for (const interceptor of interceptors) {
      // eslint-disable-next-line no-await-in-loop
      newResponse = await interceptor(response, request);
      if (!newResponse) throw new Error("Response modifier must return data");
    }
  }
  return newResponse;
};
// Mappers

export const getAdapterHeaders = (request: RequestInstance) => {
  const isFormData = request.data instanceof FormData;
  const headers: HeadersInit = {};

  if (!isFormData) headers["Content-Type"] = "application/json";

  Object.assign(headers, request.headers);
  return headers as HeadersInit;
};

export const getAdapterPayload = (data: unknown): string | FormData => {
  const isFormData = data instanceof FormData;
  if (isFormData) return data;

  return stringifyValue(data);
};

// Stringify

const isValidValue = (options: QueryStringifyOptionsType) => {
  return (value: QueryParamType) => {
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

const encodeValue = (
  value: string,
  { encode, strict }: Pick<QueryStringifyOptionsType, "encode" | "strict">,
): string => {
  if (encode && strict) {
    return encodeURIComponent(value).replace(/[!'()*]/g, (s) => `%${s.charCodeAt(0).toString(16).toUpperCase()}`);
  }
  if (encode) {
    return encodeURIComponent(value);
  }
  return value;
};

const encodeParams = (key: string, value: QueryParamType, options: QueryStringifyOptionsType) => {
  const shouldSkip = !isValidValue(options)(value);

  if (!key || shouldSkip) {
    return "";
  }

  return `${encodeValue(key, options)}=${encodeValue(String(value), options)}`;
};

const encodeArray = (key: string, array: Array<QueryParamValuesType>, options: QueryStringifyOptionsType): string => {
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
  queryParams: QueryParamsType | string | NegativeTypes,
  options: QueryStringifyOptionsType = stringifyDefaultOptions,
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
