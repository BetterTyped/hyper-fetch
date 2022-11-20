import { CommandInstance } from "command";
import { ExtractError } from "types";

// Utils

export const getErrorMessage = (errorCase?: "timeout" | "abort" | "deleted") => {
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

export const parseErrorResponse = <T extends CommandInstance>(response: unknown): ExtractError<T> => {
  return response ? parseResponse(response) : getErrorMessage();
};

// Request

export const getUploadSize = (payload: FormData | string) => {
  if (payload instanceof FormData) {
    return Array.from(payload.values())
      .map((value) => (typeof value === "string" ? value.length : value.size))
      .reduce((a, b) => a + b, 0);
  }
  return payload.length;
};
