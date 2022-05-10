import { getRequestConfig } from "client";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCommand } from "../../utils";

describe("Fetch Client [ Utils ]", () => {
  // const requestId = "test";
  const builderConfig = { timeout: 2000, responseText: "something" };
  const commandConfig = { timeout: 999, statusText: "Error" };

  let builder = createBuilder().setRequestConfig(builderConfig);
  let command = createCommand(builder, { options: commandConfig });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    builder = createBuilder().setRequestConfig(builderConfig);
    command = createCommand(builder, { options: commandConfig });
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When getRequestConfig util got triggered", () => {
    it("should merge global and local config into one", async () => {
      const config = getRequestConfig(command);
      expect(config).toStrictEqual({ ...builderConfig, ...commandConfig });
    });
  });
});

// export const getRequestConfig = <T extends Record<string, unknown> = Record<string, unknown>>(
//   command: FetchCommandInstance,
// ): T => {
//   return { ...command.builder.requestConfig, ...command.commandOptions.options };
// };

// export const getErrorMessage = (errorCase?: "timeout" | "abort") => {
//   if (errorCase === "timeout") {
//     return new Error("Request timeout");
//   }
//   if (errorCase === "abort") {
//     return new Error("Request cancelled");
//   }
//   return new Error("Unexpected error");
// };

// // Responses

// export const parseResponse = (response: string | unknown) => {
//   try {
//     return JSON.parse(response as string);
//   } catch (err) {
//     return response;
//   }
// };

// export const parseErrorResponse = <T extends FetchCommandInstance>(response: unknown): ExtractError<T> => {
//   return parseResponse(response) || getErrorMessage();
// };

// // Progress

// export const handleResponseProgressEvents = <T extends FetchCommandInstance>(
//   queueKey: string,
//   requestId: string,
//   command: T,
//   startTimestamp: number,
//   progressTimestamp: number,
//   event: ClientProgressEvent,
// ): void => {
//   const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), event);

//   command.builder.commandManager.events.emitDownloadProgress(queueKey, progress, { requestId, command });
// };

// export const handleRequestProgressEvents = <T extends FetchCommandInstance>(
//   queueKey: string,
//   requestId: string,
//   command: T,
//   startTimestamp: number,
//   progressTimestamp: number,
//   event: ClientProgressEvent,
// ): void => {
//   const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), event);

//   command.builder.commandManager.events.emitUploadProgress(queueKey, progress, { requestId, command });
// };
