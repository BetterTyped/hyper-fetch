import { Client } from "@hyper-fetch/core";

import { axiosAdapter } from "../../../src/adapter/adapter";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Axios Adapter [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" }).setAdapter(axiosAdapter);
  let request = client.createRequest()({ endpoint: "/shared-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" }).setAdapter(axiosAdapter);
    request = client.createRequest()({ endpoint: "/shared-endpoint" });

    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    const response = createRequestInterceptor(request);
    const { data, status, error, extra } = await request.send();

    expect(data).toStrictEqual(response);
    expect(status).toBe(200);
    expect(error).toBe(null);
    expect({ ...extra.headers }).toStrictEqual({
      "content-type": "application/json",
      "x-powered-by": "msw",
    });
  });

  it("should make a request and return error with status", async () => {
    createRequestInterceptor(request, { status: 400 });
    const { data, error, status, extra } = await request.send();

    expect(error.message).toBe("Request failed with status code 400");
    expect(data).toStrictEqual(null);
    expect(status).toBe(400);
    expect({ ...extra.headers }).toStrictEqual({
      "content-type": "application/json",
      "x-powered-by": "msw",
    });
  });

  it("should allow to call the request callbacks", async () => {
    createRequestInterceptor(request);

    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    const spy4 = jest.fn();
    const spy5 = jest.fn();
    const spy6 = jest.fn();

    await request.send({
      onSettle: spy1,
      onRequestStart: spy2,
      onResponseStart: spy3,
      onUploadProgress: spy4,
      onDownloadProgress: spy5,
      onResponse: spy6,
    });

    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(1);
    expect(spy4).toBeCalledTimes(2);
    expect(spy5).toBeCalledTimes(3);
    expect(spy6).toBeCalledTimes(1);
  });

  it("should allow to add upload progress", async () => {
    const postRequest = client.createRequest<any, any>()({ endpoint: "/shared-endpoint", method: "POST" });
    createRequestInterceptor(postRequest);

    const spy1 = jest.fn();
    await postRequest.send({
      data: { name: "test" },
      onUploadProgress: spy1,
    });

    expect(spy1).toBeCalledTimes(1);
  });
});
