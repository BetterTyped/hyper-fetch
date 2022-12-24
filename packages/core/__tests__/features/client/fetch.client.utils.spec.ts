import { getErrorMessage, getStreamPayload, getUploadSize, parseErrorResponse, parseResponse } from "client";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("Fetch Client [ Utils ]", () => {
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
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

  describe("When getUploadSize util get triggered", () => {
    it("should return payload size from json", async () => {
      const payload = { something: 123 };
      const size = getUploadSize(JSON.stringify(payload));
      expect(size).toEqual(17);
    });
    it("should return payload size from FormData", async () => {
      const payload = new FormData();
      payload.append("test1", JSON.stringify({ something: 123 }));
      payload.append("test2", new Blob(["test"]));
      const size = getUploadSize(payload);
      expect(size).toEqual(21);
    });
  });

  describe("When getStreamPayload util get triggered", () => {
    it("should return string from simple FormData", async () => {
      const payload = new FormData();
      payload.append("file", "test");
      const value = await getStreamPayload(payload);

      expect(value).toBeInstanceOf(Array);
      expect(value[0]).toBe(payload.get("file"));
    });
    it("should return streams from FormData", async () => {
      const payload = new FormData();
      payload.append("file", new Blob(["data:image/gif;base64,R0lGODlhAQABAAAAACw="], { type: "image/png" }));
      const value = await getStreamPayload(payload);

      expect(value).toBeInstanceOf(Array);
      expect(value[0]).toBeInstanceOf(Uint8Array);
    });
  });
});
