import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import { createClient, createSdk } from "@hyper-fetch/core";
import type { AddressInfo } from "node:net";

import type { HonoSchema } from "../../../src";
import { app } from "../../utils/app";

type Schema = HonoSchema<typeof app>;

const startServer = () =>
  new Promise<ServerType>((resolve) => {
    const server = serve({ fetch: app.fetch, port: 0 }, () => resolve(server));
  });

const stopServer = (server: ServerType) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

describe("HonoSchema [ Requests against a Hono server ]", () => {
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

  it("should send a GET to a mounted route", async () => {
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

  it("should send the payload as the JSON body the validator reads", async () => {
    const sdk = createAppSdk();

    const { data, status } = await sdk.users.$post.setPayload({ name: "Bob" }).send();

    expect(status).toBe(201);
    expect(data).toStrictEqual({ id: "2", name: "Bob" });
  });

  it("should send query params the validator reads", async () => {
    const sdk = createAppSdk();

    const { data } = await sdk.users.$userId.posts.$get.setParams({ userId: "7" }).setQueryParams({ page: "3" }).send();

    expect(data).toStrictEqual({ userId: "7", page: "3" });
  });

  it("should resolve camelCase accessors to the kebab-case Hono path", async () => {
    const sdk = createAppSdk();
    const request = sdk.auth.googleLogin.$get;

    const { data } = await request.send();

    expect(request.endpoint).toBe("/auth/google-login");
    expect(data).toStrictEqual({ authUrl: "https://accounts.example.com" });
  });

  it("should send the HTTP method named by the key", async () => {
    const sdk = createAppSdk();
    const request = sdk.auth.session.$delete;

    const { data } = await request.send();

    expect(request.method).toBe("DELETE");
    expect(data).toStrictEqual({ loggedOut: true });
  });

  it("should resolve an error status through the response", async () => {
    const sdk = createAppSdk();

    const { data, error, status, success } = await sdk.users.$userId.$get.setParams({ userId: "missing" }).send();

    expect(success).toBe(false);
    expect(status).toBe(404);
    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "User not found" });
  });
});
