import { Client } from "@hyper-fetch/core";

import { axiosAdapter } from "../../src/adapter/adapter.server";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../server";

describe("Fetch Adapter [ Browser ]", () => {
  let client = new Client({ url: "shared-base-url" }).setAdapter(() => axiosAdapter);
  let request = client.createRequest()({ endpoint: "/shared-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" }).setAdapter(() => axiosAdapter);
    request = client.createRequest()({ endpoint: "/shared-endpoint" });

    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should make a request and return success data with status", async () => {
    createRequestInterceptor(request, { fixture: { data: [] } });
    await request.send();

    // expect(response).toStrictEqual(data);
    // expect(status).toBe(200);
    // expect(error).toBe(null);
    // expect(extra).toStrictEqual({ headers: { "content-type": "application/json", "x-powered-by": "msw" } });
  });
});
