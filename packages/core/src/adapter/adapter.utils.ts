/* eslint-disable max-classes-per-file */
// Utils
import type { RequestInstance } from "request";

export class TimeoutError extends Error {
  constructor() {
    super("Request timeout");
    this.name = "TimeoutError";
  }
}

export class AbortError extends Error {
  constructor() {
    super("Request aborted");
    this.name = "AbortError";
  }
}

export class DeletedError extends Error {
  constructor() {
    super("Request deleted");
    this.name = "DeletedError";
  }
}

export class RequestProcessingError extends Error {
  description?: string = undefined;

  constructor(description?: string) {
    super("Request processing error");
    this.description = description;
    this.name = "RequestProcessingError";
  }
}

export class UnexpectedError extends Error {
  description?: string = undefined;

  constructor(description?: string) {
    super("Unexpected error");
    this.description = description;
    this.name = "UnexpectedError";
  }
}

export const getErrorMessage = (errorCase?: "timeout" | "abort" | "deleted" | "processing" | "unexpected") => {
  if (errorCase === "timeout") {
    return new TimeoutError();
  }
  if (errorCase === "abort") {
    return new AbortError();
  }
  if (errorCase === "deleted") {
    return new DeletedError();
  }
  if (errorCase === "processing") {
    return new RequestProcessingError();
  }
  return new UnexpectedError();
};

// Mappers

export const stringifyValue = (response: string | unknown): string => {
  try {
    return JSON.stringify(response as string);
  } catch {
    return "";
  }
};

/**
 * Payloads which are sent as they are - `fetch`, XHR and other transports know how to handle them
 * (and how to describe them with the `Content-Type` header)
 */
const isRawPayload = (payload: unknown): boolean => {
  return (
    (typeof FormData !== "undefined" && payload instanceof FormData) ||
    (typeof Blob !== "undefined" && payload instanceof Blob) ||
    (typeof URLSearchParams !== "undefined" && payload instanceof URLSearchParams) ||
    (typeof ReadableStream !== "undefined" && payload instanceof ReadableStream) ||
    (typeof ArrayBuffer !== "undefined" && (payload instanceof ArrayBuffer || ArrayBuffer.isView(payload)))
  );
};

/** `HeadersInit` can be an object, a list of pairs or the `Headers` instance */
const getHeadersEntries = (headers: HeadersInit | undefined): [string, string][] => {
  if (!headers) {
    return [];
  }
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    const entries: [string, string][] = [];
    headers.forEach((value, key) => entries.push([key, value]));
    return entries;
  }
  if (Array.isArray(headers)) {
    return headers as [string, string][];
  }
  return Object.entries(headers);
};

export const getAdapterHeaders = (request: RequestInstance) => {
  const isObject = typeof request.payload === "object" && request.payload !== null;
  const entries = getHeadersEntries(request.headers);
  // Header names are case-insensitive, so "content-type" given with the request replaces the default one
  const hasContentType = entries.some(([name]) => name.toLowerCase() === "content-type");
  const headers: Record<string, string> = {};

  if (isObject && !isRawPayload(request.payload) && !hasContentType) {
    headers["Content-Type"] = "application/json";
  }

  entries.forEach(([name, value]) => {
    // Empty value is the way to not send a header (also the default one)
    if (value !== undefined && value !== null) {
      headers[name] = value;
    }
  });
  return headers as HeadersInit;
};

export const getAdapterPayload = (data: unknown): string | FormData => {
  // Binary, form and stream payloads can't be turned into JSON - they would end up as "{}"
  if (isRawPayload(data)) {
    return data as FormData;
  }

  return stringifyValue(data);
};
