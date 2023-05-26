import { RequestInstance } from "request";
import { ExtractErrorType } from "types";

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

export const getResponseHeaders = (headersString: string): Record<string, string> => {
  const arr = headersString.trim().split(/[\r\n]+/);

  const headers = {};
  arr.forEach((line) => {
    const parts = line.split(": ");
    const header = parts.shift();
    const value = parts.join(": ");
    headers[header] = value;
  });

  return headers;
};

// Responses

export const parseResponse = (response: string | unknown) => {
  if (typeof response === "string") {
    try {
      return JSON.parse(response as string);
    } catch (err) {
      return response;
    }
  }

  return response;
};

export const parseErrorResponse = <T extends RequestInstance>(response: unknown): ExtractErrorType<T> => {
  return response ? parseResponse(response) : getErrorMessage();
};

// Request

export const getUploadSize = (payload: string) => {
  return payload.length;
};

export const getStreamPayload = (payload: string | null) => {
  return payload;
};
