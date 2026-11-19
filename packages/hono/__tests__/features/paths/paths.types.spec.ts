import type { ExtractEndpointType, ExtractResponseType } from "@hyper-fetch/core";
import { Hono } from "hono";
import { expectTypeOf } from "vitest";

import type { HonoAppToHyperFetch } from "../../../src";
import type { pathsApp, rootOptionalApp } from "../../utils/paths.app";

type Schema = HonoAppToHyperFetch<typeof pathsApp>;

describe("HonoAppToHyperFetch [ Optional params ]", () => {
  it("should add a route with an optional param both without and with the param", () => {
    expectTypeOf<keyof Schema["files"]>().toEqualTypeOf<"$get" | "$fileId">();
    expectTypeOf<ExtractEndpointType<Schema["files"]["$get"]>>().toEqualTypeOf<"/files">();
    expectTypeOf<ExtractEndpointType<Schema["files"]["$fileId"]["$get"]>>().toEqualTypeOf<"/files/:fileId">();
    expectTypeOf<ExtractResponseType<Schema["files"]["$get"]>>().toEqualTypeOf<{ fileId: string | null }>();
    expect(true).toBe(true);
  });

  it("should add every prefix of a route with several optional params", () => {
    type Major = Schema["versions"]["$major"];

    expectTypeOf<keyof Schema["versions"]>().toEqualTypeOf<"$major">();
    expectTypeOf<keyof Major>().toEqualTypeOf<"$get" | "$minor">();
    expectTypeOf<keyof Major["$minor"]>().toEqualTypeOf<"$get" | "$patch">();
    expectTypeOf<ExtractEndpointType<Major["$get"]>>().toEqualTypeOf<"/versions/:major">();
    expectTypeOf<ExtractEndpointType<Major["$minor"]["$get"]>>().toEqualTypeOf<"/versions/:major/:minor">();
    expectTypeOf<
      ExtractEndpointType<Major["$minor"]["$patch"]["$get"]>
    >().toEqualTypeOf<"/versions/:major/:minor/:patch">();
    expect(true).toBe(true);
  });

  it("should put the route without an optional root param at the top level", () => {
    type RootSchema = HonoAppToHyperFetch<typeof rootOptionalApp>;

    expectTypeOf<keyof RootSchema>().toEqualTypeOf<"$get" | "$lang">();
    expectTypeOf<ExtractEndpointType<RootSchema["$get"]>>().toEqualTypeOf<"/">();
    expectTypeOf<ExtractEndpointType<RootSchema["$lang"]["$get"]>>().toEqualTypeOf<"/:lang">();
    expect(true).toBe(true);
  });

  it("should not keep keys or params with the optional marker", () => {
    // @ts-expect-error - the optional param is split into two routes
    type OptionalKey = Schema["files"]["$fileId?"];

    expectTypeOf<OptionalKey>().toBeAny();
    expect(true).toBe(true);
  });
});

describe("HonoAppToHyperFetch [ Regex params ]", () => {
  it("should drop the pattern from the key and the endpoint", () => {
    expectTypeOf<keyof Schema["posts"]>().toEqualTypeOf<"$postId">();
    expectTypeOf<ExtractEndpointType<Schema["posts"]["$postId"]["$get"]>>().toEqualTypeOf<"/posts/:postId">();
    expect(true).toBe(true);
  });

  it("should drop a pattern that holds braces of its own", () => {
    expectTypeOf<keyof Schema["archive"]>().toEqualTypeOf<"$year">();
    expectTypeOf<
      ExtractEndpointType<Schema["archive"]["$year"]["$slug"]["$get"]>
    >().toEqualTypeOf<"/archive/:year/:slug">();
    expect(true).toBe(true);
  });

  it("should drop a pattern that holds a slash", () => {
    const app = new Hono().get("/docs/:path{.+/.+}/raw", (c) => c.json({ path: c.req.param("path") }));
    type DocsSchema = HonoAppToHyperFetch<typeof app>;

    expectTypeOf<keyof DocsSchema["docs"]>().toEqualTypeOf<"$path">();
    expectTypeOf<ExtractEndpointType<DocsSchema["docs"]["$path"]["raw"]["$get"]>>().toEqualTypeOf<"/docs/:path/raw">();
    expect(true).toBe(true);
  });

  it("should split an optional regex param into two routes", () => {
    const app = new Hono().get("/pages/:page{[0-9]+}?", (c) => c.json({ page: c.req.param("page") ?? "1" }));
    type PagesSchema = HonoAppToHyperFetch<typeof app>;

    expectTypeOf<keyof PagesSchema["pages"]>().toEqualTypeOf<"$get" | "$page">();
    expectTypeOf<ExtractEndpointType<PagesSchema["pages"]["$page"]["$get"]>>().toEqualTypeOf<"/pages/:page">();
    expect(true).toBe(true);
  });
});

describe("HonoAppToHyperFetch [ Path shapes ]", () => {
  it("should give a path registered without a leading slash the endpoint createSdk sends", () => {
    expectTypeOf<ExtractEndpointType<Schema["plain"]["$get"]>>().toEqualTypeOf<"/plain">();
    expect(true).toBe(true);
  });

  it("should give a path registered with a trailing slash the endpoint createSdk sends", () => {
    expectTypeOf<keyof Schema["slash"]>().toEqualTypeOf<"$get">();
    expectTypeOf<ExtractEndpointType<Schema["slash"]["$get"]>>().toEqualTypeOf<"/slash">();
    expect(true).toBe(true);
  });
});
