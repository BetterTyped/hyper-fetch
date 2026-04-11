/**
 * @vitest-environment node
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

    const onBeforeSent = vi.fn();
    request.$hooks.onBeforeSent(onBeforeSent);

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

    const onRequestStart = vi.fn();
    request.$hooks.onRequestStart(onRequestStart);

    await request.send();

    expect(onRequestStart).toHaveBeenCalledTimes(1);
  });

  it("should fire onResponse hook on success", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { name: string } }>()({
      endpoint: "/users",
      method: "GET",
    });

    const onResponse = vi.fn();
    request.$hooks.onResponse(onResponse);

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

    const hookOnResponse = vi.fn();
    const sendOnResponse = vi.fn();

    request.$hooks.onResponse(hookOnResponse);

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

    const onBeforeSent = vi.fn();
    request.$hooks.onBeforeSent(onBeforeSent);

    const cloned = request.setHeaders({ "x-custom": "test" });
    await cloned.send();

    expect(onBeforeSent).toHaveBeenCalledTimes(1);
  });

  it("should not affect original when clone hooks are modified", () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest()({ endpoint: "/users", method: "GET" });

    const originalHook = vi.fn();
    request.$hooks.onBeforeSent(originalHook);

    const cloned = request.setHeaders({ "x-custom": "test" });
    const cloneHook = vi.fn();
    cloned.$hooks.onBeforeSent(cloneHook);

    const originalSnapshot = request.$hooks.__snapshot();
    const clonedSnapshot = cloned.$hooks.__snapshot();

    expect(originalSnapshot.onBeforeSent).toHaveLength(1);
    expect(originalSnapshot.onBeforeSent[0]).toBe(originalHook);
    expect(clonedSnapshot.onBeforeSent).toHaveLength(2);
  });

  it("should support multiple listeners per hook", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { name: string } }>()({
      endpoint: "/users",
      method: "GET",
    });

    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const listener3 = vi.fn();

    request.$hooks.onResponse(listener1);
    request.$hooks.onResponse(listener2);
    request.$hooks.onResponse(listener3);

    await request.send();

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledTimes(1);
  });

  it("should unsubscribe a listener when calling the returned function", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { name: string } }>()({
      endpoint: "/users",
      method: "GET",
    });

    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const unsub1 = request.$hooks.onResponse(listener1);
    request.$hooks.onResponse(listener2);

    unsub1();

    await request.send();

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);
  });
});
