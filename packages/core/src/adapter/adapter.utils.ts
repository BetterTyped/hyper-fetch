/* eslint-disable max-classes-per-file */
// Utils
import { hasWindow } from "managers";
import { RequestInstance } from "request";

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
  description?: string;

  constructor(description?: string) {
    super("Request processing error");
    this.description = description;
    this.name = "RequestProcessingError";
  }
}

export class UnexpectedError extends Error {
  description?: string;

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
  } catch (err) {
    return "";
  }
};

export const getAdapterHeaders = (request: RequestInstance) => {
  const isFormData = hasWindow() && request.payload instanceof FormData;
  const headers: HeadersInit = {};

  if (!isFormData) headers["Content-Type"] = "application/json";

  Object.assign(headers, request.headers);
  return headers as HeadersInit;
};

export const getAdapterPayload = (data: unknown): string | FormData => {
  const isFormData = hasWindow() && data instanceof FormData;
  if (isFormData) return data;

  return stringifyValue(data);
};
