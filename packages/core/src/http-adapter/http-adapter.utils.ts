import { getErrorMessage, QueryParamsType, QueryParamType, QueryParamValuesType } from "adapter";
import { RequestInstance } from "request";
import { ExtractErrorType, EmptyTypes } from "types";
import { HttpAdapterRequest, BufferEncoding, QueryStringifyOptionsType } from "./http-adapter.types";
import { stringifyDefaultOptions } from "client";

// Utils

export const getResponseHeaders = (headersString: string): Record<string, string> => {
  const arr = headersString.trim().split(/[\r\n]+/);

  const headers: Record<string, string> = {};
  arr.forEach((line) => {
    const parts = line.split(": ");
    const header = parts.shift();
    const value = parts.join(": ");
    if (header) {
      headers[header] = value;
    }
  });

  return headers;
};

// Responses

export const parseResponse = (response: string | unknown) => {
  try {
    return JSON.parse(response as string);
  } catch (err) {
    return response;
  }
};

export const handleResponse = (
  responseChunks: any[],
  responseType: HttpAdapterRequest["responseType"],
  responseEncoding: BufferEncoding,
) => {
  const bufferedResponse = Buffer.concat(responseChunks);
  switch (responseType) {
    case "arraybuffer":
      return bufferedResponse;
    case "json":
      return parseResponse(bufferedResponse.toString(responseEncoding));
    default:
      return bufferedResponse.toString(responseEncoding);
  }
};

export const parseErrorResponse = <T extends RequestInstance>(response: unknown): ExtractErrorType<T> => {
  return response ? parseResponse(response) : (getErrorMessage() as ExtractErrorType<T>);
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

  const parsedValue = () => {
    if (value instanceof Date) {
      return options.dateParser?.(value) || value.toISOString();
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return options.objectParser?.(value) || JSON.stringify(value);
    }

    return String(value);
  };

  return `${encodeValue(key, options)}=${encodeValue(parsedValue(), options)}`;
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
  queryParams: QueryParamsType | string | EmptyTypes,
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
