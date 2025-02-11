import { createHttpMockingServer } from "@hyper-fetch/testing";

import { createClient } from "client";
import { getAdapterHeaders, getAdapterPayload, getErrorMessage } from "adapter";
import { parseResponse, parseErrorResponse } from "http-adapter";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Adapter [ Utils ]", () => {
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using getAdapterHeaders util", () => {
    it("should allow to stringify payload", async () => {
      const request = createClient({ url: "" }).createRequest<{ response: any; payload: FormData }>()({
        endpoint: "shared-base-endpoint",
      });

      expect(() => getAdapterHeaders(request)).not.toThrow();
    });
  });

  describe("When using getAdapterPayload util", () => {
    it("should allow to stringify payload", async () => {
      const data = { data: [] };

      expect(() => getAdapterPayload(data)).not.toThrow();
    });
  });
  describe("When getErrorMessage util get triggered", () => {
    it("should return abort error", async () => {
      const error = getErrorMessage("abort");
      expect(error.message).toBe("Request aborted");
    });
    it("should return timeout error", async () => {
      const error = getErrorMessage("timeout");
      expect(error.message).toBe("Request timeout");
    });
    it("should return unexpected error", async () => {
      const error = getErrorMessage();
      expect(error.message).toBe("Unexpected error");
      const error2 = getErrorMessage("unexpected");
      expect(error2.message).toBe("Unexpected error");
    });
    it("should return deleted error", async () => {
      const error = getErrorMessage("deleted");
      expect(error.message).toBe("Request deleted");
    });
    it("should return processing error", async () => {
      const error = getErrorMessage("processing");
      expect(error.message).toBe("Request processing error");
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
