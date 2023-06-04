import { Client } from "@hyper-fetch/core";

import { axiosAdapter } from "../../../src/adapter/adapter";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Fetch Adapter [ Browser ]", () => {
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

  it("should make a request and return error data with status", async () => {
    createRequestInterceptor(request, { status: 400 });
    const { data, status, extra } = await request.send();

    expect(data).toStrictEqual(null);
    expect(status).toBe(400);
    // expect(error).toBe(response.message);
    expect({ ...extra.headers }).toStrictEqual({
      "content-type": "application/json",
      "x-powered-by": "msw",
    });
  });
});
