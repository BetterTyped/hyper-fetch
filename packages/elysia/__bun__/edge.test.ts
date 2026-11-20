import { createClient, createSdk } from "@hyper-fetch/core";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";

import { edgeApp } from "../__tests__/utils/edge-app";
import type { ElysiaAppToHyperFetch } from "../src";

type Schema = ElysiaAppToHyperFetch<typeof edgeApp>;

/**
 * The cases whose wire format depends on the runtime: Bun serializes bodies, streams, redirects and
 * multipart forms itself, so the types must match what arrives there as well as on Node.
 */
describe("ElysiaAppToHyperFetch [ Edge cases against Elysia on Bun ]", () => {
  let url: string;

  const createAppSdk = () => {
    const client = createClient({ url });
    return createSdk<typeof client, Schema>(client);
  };

  beforeAll(() => {
    edgeApp.listen(0);
    const port = edgeApp.server?.port;
    if (!port) {
      throw new Error("Elysia did not start a Bun server");
    }
    url = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await edgeApp.stop();
  });

  it("should receive dates as ISO strings", async () => {
    const { data } = await createAppSdk().date.$get.send();

    expect(data).toStrictEqual({ date: "2026-01-02T03:04:05.000Z", history: ["1970-01-01T00:00:00.000Z"] });
  });

  it("should receive null as an empty body", async () => {
    const { data, success } = await createAppSdk().null.$get.send();

    expect(success).toBe(true);
    expect(data).toBe("");
  });

  it("should resolve streamed and raw responses without failing", async () => {
    const sdk = createAppSdk();

    const responses = await Promise.all([
      sdk.generator.$get.send(),
      sdk.asyncGenerator.$get.send(),
      sdk.sse.$get.send(),
      sdk.response.$get.send(),
    ]);

    expect(responses.map(({ success }) => success)).toStrictEqual([true, true, true, true]);
    expect(responses[3].data).toBe("raw text");
  });

  it("should follow a redirect to the target route", async () => {
    const { data, status } = await createAppSdk().redirect.$get.send();

    expect(status).toBe(200);
    expect(data).toBe(1);
  });

  it("should resolve a status passed by name and the status a macro returns", async () => {
    const sdk = createAppSdk();

    const teapot = await sdk.teapot.$get.send();
    const denied = await sdk.secret.$get.send();
    const allowed = await sdk.secret.$get.setHeaders({ authorization: "Bearer token" }).send();

    expect(teapot.status).toBe(418);
    expect(teapot.error).toStrictEqual({ brewing: false });
    expect(denied.error).toStrictEqual({ reason: "forbidden" });
    expect(allowed.data).toStrictEqual({ userId: "1" });
  });

  it("should send a Date the body schema parses", async () => {
    const { data } = await createAppSdk()
      .dateBody.$post.setPayload({ date: new Date("2030-06-01T00:00:00.000Z") })
      .send();

    expect(data).toStrictEqual({ year: 2030 });
  });

  it("should upload files as FormData", async () => {
    const form = new FormData();
    form.append("title", "report");
    form.append("file", new File(["12345"], "report.txt"));

    const { data } = await createAppSdk().upload.$post.setPayload(form).send();

    expect(data).toStrictEqual({ name: "report", size: 5 });
  });

  it("should send a Date and a number the query schema parses", async () => {
    const { data } = await createAppSdk()
      .queryTypes.$get.setQueryParams({ day: new Date("2026-03-04T00:00:00.000Z"), count: 3 })
      .send();

    expect(data).toStrictEqual({ day: "2026-03-04T00:00:00.000Z", count: 3, note: null });
  });

  it("should send an array query param with repeated keys", async () => {
    const client = createClient({ url });
    client.adapter.setQueryParamsMapperConfig({ arrayFormat: "none" });
    const sdk = createSdk<typeof client, Schema>(client);

    const { data } = await sdk.queryArray.$get.setQueryParams({ tags: ["a", "b"] }).send();

    expect(data).toStrictEqual({ tags: ["a", "b"] });
  });

  it("should resolve an error a handler throws with its status", async () => {
    const { error, status } = await createAppSdk().throws.$get.send();

    expect(status).toBe(500);
    // The default global error type is Error, while Elysia sends the thrown message as text
    expect<unknown>(error).toBe("Unexpected failure");
  });
});
