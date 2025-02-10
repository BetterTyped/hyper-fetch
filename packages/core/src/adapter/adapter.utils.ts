/* eslint-disable max-classes-per-file */
// Utils

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
