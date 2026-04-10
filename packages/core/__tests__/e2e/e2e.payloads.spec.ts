/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { createE2EServer, echoHandler } from "@hyper-fetch/testing";

const { route, startServer, stopServer } = createE2EServer();

describe("E2E [ Payloads ]", () => {
  let baseUrl: string;

  beforeAll(async () => {
    route("POST", "/echo", echoHandler);
    route("PUT", "/echo", echoHandler);
    route("PATCH", "/echo", echoHandler);

    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  it("should send JSON object payload", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { body: { name: string; age: number } };
      payload: { name: string; age: number };
    }>()({
      endpoint: "/echo",
      method: "POST",
    });

    const { data, error, status } = await request.send({ payload: { name: "John", age: 30 } });

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data!.body).toStrictEqual({ name: "John", age: 30 });
  });

  it("should send nested JSON payload", async () => {
    const client = new Client({ url: baseUrl });
    const payload = {
      user: {
        name: "John",
        address: {
          city: "NYC",
          zip: "10001",
        },
      },
      tags: ["admin", "user"],
    };

    const request = client.createRequest<{
      response: { body: typeof payload };
      payload: typeof payload;
    }>()({
      endpoint: "/echo",
      method: "POST",
    });

    const { data, error } = await request.send({ payload });

    expect(error).toBeNull();
    expect(data!.body).toStrictEqual(payload);
  });

  it("should send string payload", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { body: string };
      payload: string;
    }>()({
      endpoint: "/echo",
      method: "POST",
    });

    const { data, error } = await request.send({ payload: "raw-string-payload" });

    expect(error).toBeNull();
    expect(data!.body).toBe("raw-string-payload");
  });

  it("should send empty payload on POST", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { body: any; method: string };
      payload: Record<string, never>;
    }>()({
      endpoint: "/echo",
      method: "POST",
    });

    const { data, error, status } = await request.send({ payload: {} });

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data!.method).toBe("POST");
  });

  it("should send payload via PUT", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { body: { updated: boolean }; method: string };
      payload: { updated: boolean };
    }>()({
      endpoint: "/echo",
      method: "PUT",
    });

    const { data, error } = await request.send({ payload: { updated: true } });

    expect(error).toBeNull();
    expect(data!.method).toBe("PUT");
    expect(data!.body).toStrictEqual({ updated: true });
  });

  it("should send payload via PATCH", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{
      response: { body: { partial: string }; method: string };
      payload: { partial: string };
    }>()({
      endpoint: "/echo",
      method: "PATCH",
    });

    const { data, error } = await request.send({ payload: { partial: "update" } });

    expect(error).toBeNull();
    expect(data!.method).toBe("PATCH");
    expect(data!.body).toStrictEqual({ partial: "update" });
  });

  it("should send large JSON payload", async () => {
    const client = new Client({ url: baseUrl });
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }));

    const request = client.createRequest<{
      response: { body: typeof largeArray };
      payload: typeof largeArray;
    }>()({
      endpoint: "/echo",
      method: "POST",
    });

    const { data, error } = await request.send({ payload: largeArray });

    expect(error).toBeNull();
    expect(data!.body).toHaveLength(1000);
    expect(data!.body[0]).toStrictEqual({ id: 0, value: "item-0" });
    expect(data!.body[999]).toStrictEqual({ id: 999, value: "item-999" });
  });
});
