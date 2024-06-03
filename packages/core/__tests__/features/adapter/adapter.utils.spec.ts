import { createHttpMockingServer } from "@hyper-fetch/testing";

import { getErrorMessage, parseErrorResponse, parseResponse } from "adapter";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Fetch Adapter [ Utils ]", () => {
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When getErrorMessage util get triggered", () => {
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

  describe("When parseResponse util get triggered", () => {
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

  describe("When parseErrorResponse util get triggered", () => {
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
});
