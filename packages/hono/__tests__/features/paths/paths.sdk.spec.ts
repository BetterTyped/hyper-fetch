import type { ServerType } from "@hono/node-server";
import { createClient, createSdk } from "@hyper-fetch/core";

import type { HonoAppToHyperFetch } from "../../../src";
import { pathsApp } from "../../utils/paths.app";
import { startServer, stopServer } from "../../utils/server";

type Schema = HonoAppToHyperFetch<typeof pathsApp>;

describe("HonoAppToHyperFetch [ Paths against a Hono server ]", () => {
  let server: ServerType;
  let url: string;

  const createAppSdk = () => {
    const client = createClient({ url });
    return createSdk<typeof client, Schema>(client);
  };

  beforeAll(async () => {
    ({ server, url } = await startServer(pathsApp));
  });

  afterAll(async () => {
    await stopServer(server);
  });

  it("should call a route with an optional param both without and with the param", async () => {
    const sdk = createAppSdk();

    const without = await sdk.files.$get.send();
    const withParam = await sdk.files.$fileId.$get.setParams({ fileId: "report" }).send();

    expect(sdk.files.$get.endpoint).toBe("/files");
    expect(sdk.files.$fileId.$get.endpoint).toBe("/files/:fileId");
    expect(without.data).toStrictEqual({ fileId: null });
    expect(withParam.data).toStrictEqual({ fileId: "report" });
  });

  it("should call every prefix of a route with several optional params", async () => {
    const sdk = createAppSdk();

    const major = await sdk.versions.$major.$get.setParams({ major: "1" }).send();
    const minor = await sdk.versions.$major.$minor.$get.setParams({ major: "1", minor: "2" }).send();
    const patch = await sdk.versions.$major.$minor.$patch.$get.setParams({ major: "1", minor: "2", patch: "3" }).send();

    expect(major.data).toStrictEqual({ major: "1" });
    expect(minor.data).toStrictEqual({ major: "1", minor: "2" });
    expect(patch.data).toStrictEqual({ major: "1", minor: "2", patch: "3" });
  });

  it("should fill a regex param by its name", async () => {
    const sdk = createAppSdk();
    const request = sdk.posts.$postId.$get;

    const { data } = await request.setParams({ postId: "42" }).send();

    expect(request.endpoint).toBe("/posts/:postId");
    expect(data).toStrictEqual({ postId: "42" });
  });

  it("should fill a regex param whose pattern holds braces", async () => {
    const sdk = createAppSdk();

    const { data } = await sdk.archive.$year.$slug.$get.setParams({ year: "2024", slug: "launch" }).send();

    expect(data).toStrictEqual({ year: "2024", slug: "launch" });
  });

  it("should not match a regex param with a value the pattern rejects", async () => {
    const sdk = createAppSdk();

    const { status, success } = await sdk.posts.$postId.$get.setParams({ postId: "latest" }).send();

    expect(success).toBe(false);
    expect(status).toBe(404);
  });

  it("should send every standard method to an .all() route", async () => {
    const sdk = createAppSdk();

    const get = await sdk.echo.$get.send();
    const post = await sdk.echo.$post.send();
    const del = await sdk.echo.$delete.send();

    expect(get.data).toStrictEqual({ method: "GET" });
    expect(post.data).toStrictEqual({ method: "POST" });
    expect(del.data).toStrictEqual({ method: "DELETE" });
  });

  it("should send each method of an app.on() route with several methods", async () => {
    const sdk = createAppSdk();

    const put = await sdk.items.$itemId.$put.setParams({ itemId: "1" }).send();
    const patch = await sdk.items.$itemId.$patch.setParams({ itemId: "1" }).send();

    expect(put.data).toStrictEqual({ method: "PUT", itemId: "1" });
    expect(patch.data).toStrictEqual({ method: "PATCH", itemId: "1" });
  });

  it("should send to each path of an app.on() route with several paths", async () => {
    const sdk = createAppSdk();

    const health = await sdk.health.$get.send();
    const status = await sdk.status.$get.send();

    expect(health.data).toStrictEqual({ up: true });
    expect(status.data).toStrictEqual({ up: true });
  });

  it("should send to a path registered without a leading slash", async () => {
    const sdk = createAppSdk();
    const request = sdk.plain.$get;

    const { data } = await request.send();

    expect(request.endpoint).toBe("/plain");
    expect(data).toStrictEqual({ plain: true });
  });

  it("should send to a path registered with a trailing slash without the slash", async () => {
    const sdk = createAppSdk();
    const request = sdk.slash.$get;

    const { data } = await request.send();

    expect(request.endpoint).toBe("/slash");
    expect(data).toStrictEqual({ slash: true });
  });

  it("should send to a wildcard route through its literal path", async () => {
    const sdk = createAppSdk();
    const request = sdk.assets["*"].$get;

    const { data } = await request.send();

    expect(request.endpoint).toBe("/assets/*");
    expect(data).toStrictEqual({ path: "/assets/*" });
  });

  it("should send each method of two routers mounted on one path", async () => {
    const sdk = createAppSdk();

    const read = await sdk.shared.$get.send();
    const written = await sdk.shared.$post.send();

    expect(read.data).toStrictEqual({ read: true });
    expect(written.data).toStrictEqual({ written: true });
  });

  it("should send to a route nested deeper than createSdk injects its client", async () => {
    const sdk = createAppSdk();
    const request = sdk.l1.l2.l3.l4.l5.l6.l7.l8.l9.l10.l11.$leaf.$get;

    const { data } = await request.setParams({ leaf: "end" }).send();

    expect(request.endpoint).toBe("/l1/l2/l3/l4/l5/l6/l7/l8/l9/l10/l11/:leaf");
    expect(data).toStrictEqual({ leaf: "end" });
  });
});
