import {
  getErrorMessage,
  getRequestConfig,
  parseErrorResponse,
  parseResponse,
  handleError,
  handleReadyStateChange,
} from "client";
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

  beforeEach(() => {
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

  describe("When handleError util got triggered", () => {
    it("should execute onError when error response is present", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();

      const status = 400;
      const response = { message: "error" };
      const event = { target: { status, response } } as unknown as ProgressEvent<EventTarget>;

      handleError({ onError: spy1, onUnexpectedError: spy2 }, () => null)(event);

      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(0);
    });
    it("should execute onUnexpectedError when error response is missing", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();

      const event = {} as unknown as ProgressEvent<EventTarget>;

      handleError({ onError: spy1, onUnexpectedError: spy2 }, () => null)(event);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(1);
    });
  });

  describe("When handleReadyStateChange util got triggered", () => {
    it("should execute callbacks only when event is passed", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();

      const event = {} as unknown as ProgressEvent<EventTarget>;

      handleReadyStateChange({ onError: spy1, onSuccess: spy2, onResponseEnd: spy3 }, () => null)(event);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);
      expect(spy3).toBeCalledTimes(0);
    });
    it("should execute provide default data when error response is provided", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();

      const status = 400;
      const event = { target: { status, readyState: 4 } } as unknown as ProgressEvent<EventTarget>;

      handleReadyStateChange({ onError: spy1, onSuccess: spy2, onResponseEnd: spy3 }, () => null)(event);

      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(0);
      expect(spy3).toBeCalledTimes(1);
    });
    it("should execute provide default data when response is missing", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();

      const status = 200;
      const event = { target: { status, readyState: 4 } } as unknown as ProgressEvent<EventTarget>;

      handleReadyStateChange({ onError: spy1, onSuccess: spy2, onResponseEnd: spy3 }, () => null)(event);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(1);
      expect(spy3).toBeCalledTimes(1);
    });
  });
});
