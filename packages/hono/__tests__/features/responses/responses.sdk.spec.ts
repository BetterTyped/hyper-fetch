import type { ServerType } from "@hono/node-server";
import { createClient, createSdk } from "@hyper-fetch/core";

import type { HonoSchema } from "../../../src";
import { responsesApp } from "../../utils/responses.app";
import { startServer, stopServer } from "../../utils/server";

type Schema = HonoSchema<typeof responsesApp>;

describe("HonoSchema [ Responses against a Hono server ]", () => {
  let server: ServerType;
  let url: string;

  const createAppSdk = () => {
    const client = createClient({ url });
    return createSdk<typeof client, Schema>(client);
  };

  beforeAll(async () => {
    ({ server, url } = await startServer(responsesApp));
  });

  afterAll(async () => {
    await stopServer(server);
  });

  it("should resolve JSON primitives", async () => {
    const sdk = createAppSdk();

    const text = await sdk.json.string.$get.send();
    const number = await sdk.json.number.$get.send();
    const boolean = await sdk.json.boolean.$get.send();

    expect(text.data).toBe("a-string");
    expect(number.data).toBe(37);
    expect(boolean.data).toBe(true);
  });

  it("should resolve null and empty object bodies", async () => {
    const sdk = createAppSdk();

    const empty = await sdk.json.empty.$get.send();
    const nullBody = await sdk.json.null.$get.send();

    expect(empty.data).toStrictEqual({});
    expect(nullBody.data).toBeNull();
    expect(nullBody.success).toBe(true);
  });

  it("should resolve dates as ISO strings", async () => {
    const sdk = createAppSdk();

    const { data } = await sdk.json.date.$get.send();

    expect(data).toStrictEqual({ at: "2024-01-01T00:00:00.000Z" });
  });

  it("should resolve the body of the branch the handler took", async () => {
    const sdk = createAppSdk();

    const data = await sdk.json.union.$get.setQueryParams({ flag: "yes" }).send();
    const message = await sdk.json.union.$get.setQueryParams({ flag: "no" }).send();

    expect(data.data).toStrictEqual({ data: "foo" });
    expect(message.data).toStrictEqual({ message: "error" });
  });

  it("should resolve a 2xx status as data and any other status as the error", async () => {
    const sdk = createAppSdk();

    const ok = await sdk.statuses.$get.setQueryParams({ flag: "no" }).send();
    const failed = await sdk.statuses.$get.setQueryParams({ flag: "yes" }).send();

    expect(ok).toMatchObject({ status: 200, success: true, data: { data: "foo" }, error: null });
    expect(failed).toMatchObject({ status: 400, success: false, data: null, error: { message: "Bad request" } });
  });

  it("should resolve the response a middleware returns early as the error", async () => {
    const sdk = createAppSdk();

    const rejected = await sdk.guarded.$post.send();
    const created = await sdk.guarded.$post.setHeaders({ authorization: "Bearer token" }).send();

    expect(rejected).toMatchObject({ status: 401, data: null, error: { error: "Unauthorized" } });
    expect(created).toMatchObject({ status: 201, data: { created: true } });
  });

  it("should resolve c.text() as the raw text", async () => {
    const sdk = createAppSdk();

    const { data } = await sdk.text.$get.send();

    expect(data).toBe("Hello, Hono!");
  });

  it("should parse a c.text() body that is valid JSON, unlike its string type", async () => {
    const sdk = createAppSdk();

    const { data } = await sdk.text.numeric.$get.send();

    expect(data).toBe(42);
  });

  it("should resolve c.body() as the raw body", async () => {
    const sdk = createAppSdk();

    const { data } = await sdk.body.$get.send();

    expect(data).toBe("raw body");
  });

  it("should resolve an empty c.body(null) as an empty string, unlike its null type", async () => {
    const sdk = createAppSdk();

    const ok = await sdk.body.null.$get.send();
    const noContent = await sdk.body.empty.$delete.send();

    expect(ok).toMatchObject({ status: 200, success: true, data: "" });
    expect(noContent).toMatchObject({ status: 204, success: true, data: "" });
  });

  it("should follow c.redirect() and resolve the body of the target, unlike its undefined type", async () => {
    const sdk = createAppSdk();

    const { data, status } = await sdk.redirect.$get.setQueryParams({ flag: "yes" }).send();

    expect(status).toBe(200);
    expect(data).toBe("Hello, Hono!");
  });

  it("should resolve c.newResponse() with its body and status", async () => {
    const sdk = createAppSdk();

    const { data, status } = await sdk.newResponse.$get.send();

    expect(status).toBe(202);
    expect(data).toBe("custom");
  });

  it("should resolve c.notFound() as a 404 error", async () => {
    const sdk = createAppSdk();

    const { data, error, status } = await sdk.notFound.$get.send();

    expect(status).toBe(404);
    expect(data).toBeNull();
    expect(error).toBe("404 Not Found");
  });
});
