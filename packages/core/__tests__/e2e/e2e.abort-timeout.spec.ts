/**
 * @vitest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { createE2EServer, delayHandler, jsonHandler } from "@hyper-fetch/testing";

const { route, startServer, stopServer } = createE2EServer();

describe("E2E [ Abort & Timeout ]", () => {
  let baseUrl: string;

  beforeAll(async () => {
    route("GET", "/slow", delayHandler(2000, { result: "slow" }));
    route("GET", "/fast", jsonHandler({ result: "fast" }));

    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  it("should abort a request mid-flight", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { result: string } }>()({
      endpoint: "/slow",
      method: "GET",
    });

    const promise = request.send();

    setTimeout(() => {
      request.abort();
    }, 50);

    const { data, status } = await promise;

    expect(data).toBeNull();
    expect(status).toBe(0);
  });

  it("should timeout when server takes too long", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{ response: { result: string } }>()({
        endpoint: "/slow",
        method: "GET",
      })
      .setOptions({ timeout: 50 });

    const { data, error, status } = await request.send();

    expect(data).toBeNull();
    expect(status).toBe(0);
    expect(error).toBeDefined();
  });

  it("should complete fast request before timeout", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{ response: { result: string } }>()({
        endpoint: "/fast",
        method: "GET",
      })
      .setOptions({ timeout: 5000 });

    const { data, error, status } = await request.send();

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toStrictEqual({ result: "fast" });
  });

  it("should abort one request without affecting another", async () => {
    const client = new Client({ url: baseUrl });
    const slowRequest = client.createRequest<{ response: { result: string } }>()({
      endpoint: "/slow",
      method: "GET",
      cancelable: true,
    });
    const fastRequest = client.createRequest<{ response: { result: string } }>()({
      endpoint: "/fast",
      method: "GET",
    });

    const slowPromise = slowRequest.send();

    setTimeout(() => {
      slowRequest.abort();
    }, 50);

    const [slowResult, fastResult] = await Promise.all([slowPromise, fastRequest.send()]);

    expect(slowResult.data).toBeNull();
    expect(slowResult.status).toBe(0);

    expect(fastResult.error).toBeNull();
    expect(fastResult.status).toBe(200);
    expect(fastResult.data).toStrictEqual({ result: "fast" });
  });
});
