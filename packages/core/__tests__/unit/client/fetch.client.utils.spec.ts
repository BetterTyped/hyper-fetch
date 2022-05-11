import {
  getErrorMessage,
  getRequestConfig,
  handleRequestProgressEvents,
  handleResponseProgressEvents,
  parseErrorResponse,
  parseResponse,
} from "client";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { testProgressSpy } from "../../shared";
import { createBuilder, createCommand } from "../../utils";

describe("Fetch Client [ Utils ]", () => {
  const requestId = "test";
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
      expect(config).not.toStrictEqual({ ...commandConfig, ...builderConfig });
    });
  });

  describe("When getErrorMessage util got triggered", () => {
    it("should return abort error", async () => {
      const error = getErrorMessage("abort");
      expect(error.message).toBe("Request cancelled");
    });
    it("should return timeout error", async () => {
      const error = getErrorMessage("timeout");
      expect(error.message).toBe("Request timeout");
    });
    it("should return unexpected error", async () => {
      const error = getErrorMessage();
      expect(error.message).toBe("Unexpected error");
    });
  });

  describe("When parseResponse util got triggered", () => {
    it("should return parsed response json", async () => {
      const response = { something: 123 };
      const parsed = parseResponse(JSON.stringify(response));
      expect(parsed).toEqual(response);
    });
    it("should return invalid original on parsing error", async () => {
      const invalidResponse = () => null;
      const parsed = parseResponse(invalidResponse);
      expect(parsed).toBe(invalidResponse);
    });
  });

  describe("When parseErrorResponse util got triggered", () => {
    it("should return parsed error json", async () => {
      const response = { something: 123 };
      const parsed = parseErrorResponse(JSON.stringify(response));
      expect(parsed).toEqual(response);
    });
    it("should return unexpected error when no response is passed", async () => {
      const parsed = parseErrorResponse(null);
      expect(parsed?.message).toBe("Unexpected error");
    });
  });

  describe("When handleResponseProgressEvents util got triggered", () => {
    it("should emit progress message", async () => {
      const spy = jest.fn();
      const unmount = builder.commandManager.events.onDownloadProgress(command.queueKey, spy);
      const startTimestamp = +new Date() - 20;
      const progressTimestamp = +new Date();
      const progress = { total: 20, loaded: 10 };
      handleResponseProgressEvents(requestId, command, startTimestamp, progressTimestamp, progress);
      unmount();
      testProgressSpy({ ...progress, spy, command, requestId, startTimestamp, progressTimestamp });
    });
  });

  describe("When handleRequestProgressEvents util got triggered", () => {
    it("should emit progress message", async () => {
      const spy = jest.fn();
      const unmount = builder.commandManager.events.onUploadProgress(command.queueKey, spy);
      const startTimestamp = +new Date() - 20;
      const progressTimestamp = +new Date();
      const progress = { total: 20, loaded: 10 };
      handleRequestProgressEvents(requestId, command, startTimestamp, progressTimestamp, progress);
      unmount();
      testProgressSpy({ ...progress, spy, command, requestId, startTimestamp, progressTimestamp });
    });
  });
});
