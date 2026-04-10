/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { createE2EServer, jsonHandler } from "@hyper-fetch/testing";

const server = createE2EServer();
let baseUrl: string;

beforeAll(async () => {
  server.route("GET", "/users", jsonHandler({ name: "John" }));
  server.route("POST", "/users", jsonHandler({ created: true }));
  baseUrl = await server.startServer();
});

afterAll(async () => {
  await server.stopServer();
});

describe("Request [ $hooks ]", () => {
  it("should fire onBeforeSent hook", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { name: string } }>()({
      endpoint: "/users",
      method: "GET",
    });

    const onBeforeSent = jest.fn();
    request.$hooks.onBeforeSent = onBeforeSent;

    await request.send();

    expect(onBeforeSent).toHaveBeenCalledTimes(1);
    expect(onBeforeSent).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: expect.any(String),
        request: expect.any(Object),
      }),
    );
  });

  it("should fire onRequestStart hook", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { name: string } }>()({
      endpoint: "/users",
      method: "GET",
    });

    const onRequestStart = jest.fn();
    request.$hooks.onRequestStart = onRequestStart;

    await request.send();

    expect(onRequestStart).toHaveBeenCalledTimes(1);
  });

  it("should fire onResponse hook on success", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { name: string } }>()({
      endpoint: "/users",
      method: "GET",
    });

    const onResponse = jest.fn();
    request.$hooks.onResponse = onResponse;

    const { data, error, status, success } = await request.send();

    expect(error).toBeNull();
    expect(success).toBe(true);
    expect(status).toBe(200);
    expect(data).toStrictEqual({ name: "John" });
    expect(onResponse).toHaveBeenCalledTimes(1);
  });

  it("should fire hooks alongside send() callbacks", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { name: string } }>()({
      endpoint: "/users",
      method: "GET",
    });

    const hookOnResponse = jest.fn();
    const sendOnResponse = jest.fn();

    request.$hooks.onResponse = hookOnResponse;

    await request.send({
      onResponse: sendOnResponse,
    });

    expect(hookOnResponse).toHaveBeenCalledTimes(1);
    expect(sendOnResponse).toHaveBeenCalledTimes(1);
  });

  it("should inherit $hooks through clone", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { name: string } }>()({
      endpoint: "/users",
      method: "GET",
    });

    const onBeforeSent = jest.fn();
    request.$hooks.onBeforeSent = onBeforeSent;

    const cloned = request.setHeaders({ "x-custom": "test" });
    await cloned.send();

    expect(onBeforeSent).toHaveBeenCalledTimes(1);
  });

  it("should not affect original when clone hooks are modified", () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest()({ endpoint: "/users", method: "GET" });

    const originalHook = jest.fn();
    request.$hooks.onBeforeSent = originalHook;

    const cloned = request.setHeaders({ "x-custom": "test" });
    cloned.$hooks.onBeforeSent = jest.fn();

    expect(request.$hooks.onBeforeSent).toBe(originalHook);
  });
});
