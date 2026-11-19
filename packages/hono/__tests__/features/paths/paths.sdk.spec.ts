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
});
