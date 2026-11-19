import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import { createClient, createSdk } from "@hyper-fetch/core";
import type { AddressInfo } from "node:net";

import type { ElysiaAppToHyperFetch } from "../../../src";
import { app } from "../../utils/app";

type Schema = ElysiaAppToHyperFetch<typeof app>;

// `app.fetch` is the web standard handler Elysia runs on every runtime, served here on a free port
const startServer = () =>
  new Promise<ServerType>((resolve) => {
    const server = serve({ fetch: app.fetch, port: 0 }, () => resolve(server));
  });

const stopServer = (server: ServerType) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

describe("ElysiaAppToHyperFetch [ Requests against an Elysia server ]", () => {
  let server: ServerType;
  let url: string;

  const createAppSdk = () => {
    const client = createClient({ url });
    return createSdk<typeof client, Schema>(client);
  };

  beforeAll(async () => {
    server = await startServer();
    url = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await stopServer(server);
  });

  it("should send a GET to a plugin route", async () => {
    const sdk = createAppSdk();

    const { data, error, status } = await sdk.users.$get.send();

    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(data).toStrictEqual([{ id: "1", name: "Ann" }]);
  });

  it("should send to the root route", async () => {
    const sdk = createAppSdk();

    const { data } = await sdk.$get.send();

    expect(data).toStrictEqual({ ok: true });
  });

  it("should fill :param segments from setParams", async () => {
    const sdk = createAppSdk();

    const { data } = await sdk.users.$userId.$get.setParams({ userId: "42" }).send();

    expect(data).toStrictEqual({ id: "42", name: "Ann" });
  });

  it("should call a route with an optional param both without and with the param", async () => {
    const sdk = createAppSdk();

    const withoutParam = await sdk.files.$get.send();
    const withParam = await sdk.files.$fileId.$get.setParams({ fileId: "report" }).send();

    expect(withoutParam.data).toStrictEqual({ fileId: null });
    expect(withParam.data).toStrictEqual({ fileId: "report" });
  });

  it("should send the payload as the JSON body the schema reads", async () => {
    const sdk = createAppSdk();

    const { data, status } = await sdk.users.$post.setPayload({ name: "Bob" }).send();

    expect(status).toBe(201);
    expect(data).toStrictEqual({ id: "2", name: "Bob" });
  });

  it("should send query params the schema reads", async () => {
    const sdk = createAppSdk();

    const { data } = await sdk.users.$userId.posts.$get.setParams({ userId: "7" }).setQueryParams({ page: "3" }).send();

    expect(data).toStrictEqual({ userId: "7", page: "3" });
  });

  it("should resolve camelCase accessors to the kebab-case Elysia path", async () => {
    const sdk = createAppSdk();
    const request = sdk.auth.googleLogin.$get;

    const { data } = await request.send();

    expect(request.endpoint).toBe("/auth/google-login");
    expect(data).toStrictEqual({ authUrl: "https://accounts.example.com" });
  });

  it("should send the HTTP method named by the key", async () => {
    const sdk = createAppSdk();
    const deleteRequest = sdk.auth.session.$delete;
    const customRequest = sdk.dav.$propfind;

    const deleted = await deleteRequest.send();
    const custom = await customRequest.send();

    expect(deleteRequest.method).toBe("DELETE");
    expect(deleted.data).toStrictEqual({ loggedOut: true });
    expect(customRequest.method).toBe("PROPFIND");
    expect(custom.data).toStrictEqual({ dav: true });
  });

  it("should resolve an error status through the response", async () => {
    const sdk = createAppSdk();

    const { data, error, status, success } = await sdk.users.$userId.$get.setParams({ userId: "missing" }).send();

    expect(success).toBe(false);
    expect(status).toBe(404);
    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "User not found" });
  });

  it("should resolve a route without a 2xx status with its error", async () => {
    const sdk = createAppSdk();

    const { data, error, status } = await sdk.maintenance.$get.send();

    expect(status).toBe(503);
    expect(data).toBeNull();
    expect(error).toStrictEqual({ retryAfter: 60 });
  });

  it("should resolve the validation error of a rejected body", async () => {
    const client = createClient({ url });
    const request = client.createRequest<{ payload: { name: number } }>()({ endpoint: "/users", method: "POST" });

    const { error, status, success } = await request.setPayload({ name: 1 }).send();

    expect(success).toBe(false);
    expect(status).toBe(422);
    expect(error).toMatchObject({ type: "validation", on: "body" });
  });
});
