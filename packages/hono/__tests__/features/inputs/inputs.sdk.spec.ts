import type { ServerType } from "@hono/node-server";
import { createClient, createSdk } from "@hyper-fetch/core";

import type { HonoAppToHyperFetch } from "../../../src";
import { inputsApp } from "../../utils/inputs.app";
import { startServer, stopServer } from "../../utils/server";

type Schema = HonoAppToHyperFetch<typeof inputsApp>;

describe("HonoAppToHyperFetch [ Validator inputs against a Hono server ]", () => {
  let server: ServerType;
  let url: string;

  const createAppSdk = () => {
    const client = createClient({ url });
    return { client, sdk: createSdk<typeof client, Schema>(client) };
  };

  beforeAll(async () => {
    ({ server, url } = await startServer(inputsApp));
  });

  afterAll(async () => {
    await stopServer(server);
  });

  it("should send the payload as the JSON body the json validator reads", async () => {
    const { sdk } = createAppSdk();

    const { data, status } = await sdk.posts.$post.setPayload({ title: "Hello", draft: true }).send();

    expect(status).toBe(201);
    expect(data).toStrictEqual({ title: "Hello", draft: true });
  });

  it("should send array query params in the bracket format by default", async () => {
    const { sdk } = createAppSdk();

    const { data } = await sdk.search.$get.setQueryParams({ q: "hono", tags: ["a", "b"] }).send();

    expect(data).toStrictEqual({ query: { q: "hono", "tags[]": ["a", "b"] }, tags: [] });
  });

  it("should send array query params as repeated keys with the none array format", async () => {
    const { client, sdk } = createAppSdk();
    client.adapter.setQueryParamsMapperConfig({ arrayFormat: "none" });

    const { data } = await sdk.search.$get.setQueryParams({ q: "hono", tags: ["a", "b"] }).send();

    expect(data).toStrictEqual({ query: { q: "hono", tags: ["a", "b"] }, tags: ["a", "b"] });
  });

  it("should send array query params as one comma separated value with the comma array format", async () => {
    const { client, sdk } = createAppSdk();
    client.adapter.setQueryParamsMapperConfig({ arrayFormat: "comma" });

    const { data } = await sdk.search.$get.setQueryParams({ tags: ["a", "b"] }).send();

    expect(data).toStrictEqual({ query: { tags: "a,b" }, tags: ["a,b"] });
  });

  it("should send no body to a form route, so the form validator reads an empty form", async () => {
    const { sdk } = createAppSdk();

    const { data, status } = await sdk.upload.$post.send();

    expect(status).toBe(200);
    expect(data).toStrictEqual({ title: null, contentType: null });
  });

  it("should reach a form route with a FormData payload", async () => {
    const { client } = createAppSdk();
    const request = client.createRequest<{ payload: FormData }>()({ endpoint: "/upload", method: "POST" });
    const form = new FormData();
    form.append("title", "Hello");

    const { data } = await request.setPayload(form).send();

    expect(data).toMatchObject({ title: "Hello", contentType: expect.stringContaining("multipart/form-data") });
  });

  it("should pass header and cookie validators with headers set on the request", async () => {
    const { sdk } = createAppSdk();

    const { data } = await sdk.whoami.$get.setHeaders({ "x-request-id": "req-1", cookie: "session=abc" }).send();

    expect(data).toStrictEqual({ requestId: "req-1", session: "abc", raw: "abc" });
  });

  it("should combine params, payload and query params on one route", async () => {
    const { sdk } = createAppSdk();

    const { data } = await sdk.posts.$postId.$put
      .setParams({ postId: "7" })
      .setPayload({ title: "Edited" })
      .setQueryParams({ notify: "true" })
      .send();

    expect(data).toStrictEqual({ postId: 7, title: "Edited", notify: true });
  });

  it("should resolve the response a validator returns as the error", async () => {
    const { client } = createAppSdk();
    const request = client.createRequest<{ payload: { title: string } }>()({ endpoint: "/strict", method: "POST" });

    const { data, error, status, success } = await request.setPayload({ title: "No name" }).send();

    expect(success).toBe(false);
    expect(status).toBe(400);
    expect(data).toBeNull();
    expect(error).toStrictEqual({ error: "Name is required" });
  });
});
