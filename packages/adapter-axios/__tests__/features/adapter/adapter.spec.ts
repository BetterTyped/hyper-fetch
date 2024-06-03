import { Client } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { AxiosAdapter } from "../../../src/adapter/adapter";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

describe("Axios Adapter [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" }).setAdapter(AxiosAdapter);
  let request = client.createRequest()({ endpoint: "/shared-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" }).setAdapter(AxiosAdapter);
    request = client.createRequest()({ endpoint: "/shared-endpoint" });

    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    const response = mockRequest(request);
    const { data, status, error, extra } = await request.send();

    expect(data).toStrictEqual(response);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect({ ...extra.headers }).toStrictEqual({
      "content-type": "application/json",
      "content-length": "0",
    });
  });

  it("should make a request and return error with status", async () => {
    mockRequest(request, { status: 400 });
    const { data, error, status, extra } = await request.send();

    expect(error.message).toBe("Request failed with status code 400");
    expect(data).toStrictEqual(null);
    expect(status).toBe(400);
    expect({ ...extra.headers }).toStrictEqual({
      "content-type": "application/json",
      "content-length": "0",
    });
  });

  it("should allow to call the request callbacks", async () => {
    mockRequest(request);

    const spySettle = jest.fn();
    const spyReqStart = jest.fn();
    const spyResStart = jest.fn();
    const spyUpload = jest.fn();
    const spyDownload = jest.fn();
    const spyResponse = jest.fn();

    await request.send({
      onSettle: spySettle,
      onRequestStart: spyReqStart,
      onResponseStart: spyResStart,
      onUploadProgress: spyUpload,
      onDownloadProgress: spyDownload,
      onResponse: spyResponse,
    });

    expect(spySettle).toHaveBeenCalledTimes(1);
    expect(spyReqStart).toHaveBeenCalledTimes(1);
    expect(spyResStart).toHaveBeenCalledTimes(1);
    expect(spyUpload).toHaveBeenCalledTimes(2);
    expect(spyDownload).toHaveBeenCalledTimes(3);
    expect(spyResponse).toHaveBeenCalledTimes(1);
  });

  it("should allow to add upload progress", async () => {
    const postRequest = client.createRequest<any, any>()({ endpoint: "/shared-endpoint", method: "POST" });
    mockRequest(postRequest);

    const spyUpload = jest.fn();
    await postRequest.send({
      data: { name: "test" },
      onUploadProgress: spyUpload,
    });

    expect(spyUpload).toHaveBeenCalledTimes(1);
  });
});
