/**
 * @jest-environment node
 */
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { Readable } from "stream";

import { getErrorMessage } from "adapter";
import { Client, ClientInstance } from "client";
import { FetchHttpAdapter } from "http-adapter";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

type StreamResponse = ReadableStream | import("stream/web").ReadableStream;

const createStreamingRequest = (client: ClientInstance) => {
  const requestId = "test";
  const abortKey = "abort-key";

  const request = client.createRequest<{ response: StreamResponse }>()({
    endpoint: "/streaming-endpoint",
    abortKey,
  });
  client.requestManager.addAbortController(request.abortKey, requestId);

  const responseData = ["1", "2", "3", "4", "5"];

  const rs = Readable.from(responseData);
  const webStream = Readable.toWeb(rs);
  return { request, responseData, webStream, requestId };
};

describe("Fetch Adapter", () => {
  let client: Client;

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "https://shared-base-url" });
    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("Streams", () => {
    describe("When receiving a stream as a response", () => {
      it("should allow for handling it as a stream", async () => {
        const { request, responseData, webStream, requestId } = createStreamingRequest(client);

        mockRequest(request, { data: webStream });
        const { data: response, error, status } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);
        const responseChunks = [];
        for await (const chunk of response) {
          responseChunks.push(chunk);
        }

        expect(response instanceof ReadableStream).toBeTruthy();
        expect(responseChunks).toStrictEqual(responseData);
        expect(status).toBe(200);
        expect(error).toBe(null);
      });
    });
    describe("When putting stream as a body payload", () => {
      it("should allow for handling it as a stream", async () => {
        const requestId = "test";
        const abortKey = "abort-key";
        const responseData = ["1", "2", "3", "4", "5"];

        const rs = Readable.from(responseData);
        const webStream = Readable.toWeb(rs);

        const request = client
          .createRequest<{ response: StreamResponse; payload: StreamResponse }>()({
            method: "POST",
            endpoint: "/streaming-endpoint",
            abortKey,
          })
          .setPayload(webStream);
        client.requestManager.addAbortController(request.abortKey, requestId);
        mockRequest(request, { data: webStream });
        const { data: response, error, status } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);
        const responseChunks = [];
        for await (const chunk of response) {
          responseChunks.push(chunk);
        }

        expect(response instanceof ReadableStream).toBeTruthy();
        expect(responseChunks).toStrictEqual(responseData);
        expect(status).toBe(200);
        expect(error).toBe(null);
      });
    });
  });

  describe("General Features", () => {
    it("should handle  timeout", async () => {
      const { request, webStream, requestId } = createStreamingRequest(client);

      const timeoutRequest = request.setOptions({ timeout: 50 });
      mockRequest(timeoutRequest, { data: webStream, streamChunkDelay: 30, delay: 1000 });

      const { data: response, error } = await FetchHttpAdapter().initialize(client).fetch(timeoutRequest, requestId);

      expect(response).toBe(null);
      expect(error.message).toEqual(getErrorMessage("timeout").message);
    });

    it("should handle abort", async () => {
      const { request, webStream, requestId } = createStreamingRequest(client);

      mockRequest(request, { data: webStream, streamChunkDelay: 100 });

      setTimeout(() => {
        request.abort();
      }, 30);

      const { data: response, error } = await FetchHttpAdapter().initialize(client).fetch(request, requestId);

      expect(response).toBe(null);
      expect(error.message).toEqual(getErrorMessage("abort").message);
    });
  });

  describe("Node.js Stream Integration", () => {
    it("should handle readable streams as payload", async () => {});
    it("should handle downloading file", async () => {
      // const postRequest = request.setMethod("POST");
      // const fs = require("fs");
      // const path = require("path");
      //
      // // Create a temporary file for testing
      // const tempFile = path.join(__dirname, "temp-test-file.txt");
      // fs.writeFileSync(tempFile, "Test file content for streaming");
      //
      // const fileStream = fs.createReadStream(tempFile);
      // const data = mockRequest(postRequest, { data: { received: "file-stream" } });
      //
      // const { data: response } = await FetchHttpAdapter()
      //   .initialize(client)
      //   .fetch(postRequest.setPayload(fileStream), requestId);
      //
      // expect(response).toStrictEqual(data);
      //
      // // Clean up
      // fs.unlinkSync(tempFile);
    });
  });

  describe("Node.js File System Integration", () => {});
});
