import type { QueryParamsType, QueryParamType, QueryParamValuesType } from "adapter";
import { getErrorMessage } from "adapter";
import { stringifyDefaultOptions } from "client";
import type { RequestInstance } from "request";
import type { ExtractErrorType, EmptyTypes } from "types";

import type { BufferEncoding, QueryStringifyOptionsType } from "./http-adapter.types";

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
  } catch {
    return response;
  }
};

export const handleResponse = (responseChunks: any[], responseType: string, responseEncoding: BufferEncoding) => {
  const bufferedResponse = Buffer.concat(responseChunks);
  switch (responseType) {
    case "arraybuffer": {
      return bufferedResponse;
    }
    case "json": {
      return parseResponse(bufferedResponse.toString(responseEncoding));
    }
    default: {
      return bufferedResponse.toString(responseEncoding);
    }
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
    return encodeURIComponent(value).replaceAll(/[!'()*]/g, (s) => `%${s.codePointAt(0)!.toString(16).toUpperCase()}`);
  }
  if (encode) {
    return encodeURIComponent(value);
  }
  return value;
};

const parseValue = (value: QueryParamValuesType, options: QueryStringifyOptionsType): string => {
  if (value instanceof Date) {
    return options.dateParser?.(value) || value.toISOString();
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return options.objectParser?.(value) || JSON.stringify(value);
  }

  return String(value);
};

const encodeParams = (key: string, value: QueryParamType, options: QueryStringifyOptionsType) => {
  const shouldSkip = !isValidValue(options)(value);

  if (!key || shouldSkip) {
    return "";
  }

  return `${encodeValue(key, options)}=${encodeValue(parseValue(value as QueryParamValuesType, options), options)}`;
};

const encodeArray = (key: string, array: QueryParamValuesType[], options: QueryStringifyOptionsType): string => {
  const { arrayFormat, arraySeparator } = options;
  const separator = arraySeparator || "|";
  const encodedKey = encodeValue(key, options);

  return array
    .filter(isValidValue(options))
    .reduce<string[]>((acc, value, index) => {
      const encodedValue = encodeValue(parseValue(value, options), options);

      switch (arrayFormat) {
        case "index": {
          acc.push(`${encodedKey}[${encodeValue(String(index), options)}]=${encodedValue}`);
          break;
        }
        case "bracket": {
          acc.push(`${encodedKey}[]=${encodedValue}`);
          break;
        }
        case "comma": {
          const keyValue = (acc.length === 0 && `${encodedKey}=`) || "";
          return [[...acc, `${keyValue}${encodedValue}`].join(",")];
        }
        case "separator": {
          const keyValue = (acc.length === 0 && `${encodedKey}=`) || "";
          return [[...acc, `${keyValue}${encodedValue}`].join(separator)];
        }
        case "bracket-separator": {
          const keyValue = (acc.length === 0 && `${encodedKey}[]=`) || "";
          return [[...acc, `${keyValue}${encodedValue}`].join(separator)];
        }
        default: {
          acc.push(`${encodedKey}=${encodedValue}`);
        }
      }

      return acc;
    }, [])
    .join("&");
};

export const stringifyQueryParams = (
  queryParams: QueryParamsType | string | EmptyTypes,
  options?: QueryStringifyOptionsType,
): string => {
  // Merge with defaults so a partial config (e.g. `{ arrayFormat: "comma" }`) keeps encoding and skipping enabled
  const config: QueryStringifyOptionsType = { ...stringifyDefaultOptions, ...options };

  if (!queryParams || Object.keys(queryParams).length === 0) {
    return "";
  }

  if (typeof queryParams === "string") {
    const hasQuestionMark = queryParams[0] === "?";
    return hasQuestionMark ? queryParams : `?${queryParams}`;
  }

  const stringified = Object.entries(queryParams)
    .map(([key, value]): string => {
      if (Array.isArray(value)) {
        return encodeArray(key, value, config);
      }

      return encodeParams(key, value, config);
    })
    .filter(Boolean)
    .join("&");

  if (stringified) {
    return `?${stringified}`;
  }
  return "";
};
