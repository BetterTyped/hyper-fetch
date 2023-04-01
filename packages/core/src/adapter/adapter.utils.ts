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

// Responses

export const parseResponse = (response: string | unknown) => {
  try {
    return JSON.parse(response as string);
  } catch (err) {
    return response;
  }
};

export const parseErrorResponse = <T extends RequestInstance>(response: unknown): ExtractErrorType<T> => {
  return response ? parseResponse(response) : getErrorMessage();
};

// Request

export const getUploadSize = (payload: string) => {
  return payload.length;
};

export const fileToBuffer = (file: File | Blob) => {
  return new Promise<Uint8Array>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Uint8Array(reader.result as ArrayBufferLike));
    };
    reader.readAsArrayBuffer(file);
  });
};

export const getStreamPayload = (payload: string | null) => {
  return payload;
};
