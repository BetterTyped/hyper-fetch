import { CommandInstance } from "command";
import { ExtractError } from "types";

// Utils

export const getRequestConfig = <T extends Record<string, unknown> = Record<string, unknown>>(
  command: CommandInstance,
): T => {
  return { ...command.builder.requestConfig, ...command.commandOptions.options };
};

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
