import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createClient, createSdk } from "@hyper-fetch/core";

import type { ElysiaAppToHyperFetch } from "../src";
import { app } from "../__tests__/utils/app";

type Schema = ElysiaAppToHyperFetch<typeof app>;

/**
 * Runs with `bun test`, so Elysia serves through `Bun.serve` and Hyper Fetch sends with the fetch
 * of Bun. The vitest specs cover the same routes on Node.
 */
describe("ElysiaAppToHyperFetch [ Requests against Elysia on Bun ]", () => {
  let url: string;

  const createAppSdk = () => {
    const client = createClient({ url });
    return createSdk<typeof client, Schema>(client);
  };

  beforeAll(() => {
    app.listen(0);
    const port = app.server?.port;
    if (!port) {
      throw new Error("Elysia did not start a Bun server");
    }
    url = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await app.stop();
  });

  it("should send a GET to a plugin route", async () => {
    const sdk = createAppSdk();

    const { data, error, status } = await sdk.users.$get.send();

    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(data).toStrictEqual([{ id: "1", name: "Ann" }]);
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

  it("should send a custom method", async () => {
    const sdk = createAppSdk();

    const { data } = await sdk.dav.$propfind.send();

    expect(data).toStrictEqual({ dav: true });
  });

  it("should resolve an error status through the response", async () => {
    const sdk = createAppSdk();

    const { data, error, status, success } = await sdk.users.$userId.$get.setParams({ userId: "missing" }).send();

    expect(success).toBe(false);
    expect(status).toBe(404);
    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "User not found" });
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
