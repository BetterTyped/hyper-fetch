import { createClient, createSdk } from "@hyper-fetch/core";
import type { ClientInstance, ExtractClientType, ExtractEndpointType, ExtractResponseType } from "@hyper-fetch/core";
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

describe("HonoAppToHyperFetch [ Methods ]", () => {
  it("should expand an .all() route into every standard method", () => {
    expectTypeOf<keyof Schema["echo"]>().toEqualTypeOf<
      "$get" | "$post" | "$put" | "$delete" | "$options" | "$patch" | "$query"
    >();
    expectTypeOf<ExtractResponseType<Schema["echo"]["$post"]>>().toEqualTypeOf<{ method: string }>();
    expectTypeOf<ExtractEndpointType<Schema["echo"]["$delete"]>>().toEqualTypeOf<"/echo">();
    expect(true).toBe(true);
  });

  it("should not keep the $all key Hono stores .all() routes under", () => {
    // @ts-expect-error - ALL is not an HTTP method a client can send
    type AllKey = Schema["echo"]["$all"];

    expectTypeOf<AllKey>().toBeAny();
    expect(true).toBe(true);
  });

  it("should keep a method registered next to an .all() route on the same path", () => {
    const app = new Hono()
      .all("/hook", (c) => c.json({ any: true as const }))
      .get("/hook", (c) => c.json({ read: true as const }));
    type HookSchema = HonoAppToHyperFetch<typeof app>;

    expectTypeOf<ExtractResponseType<HookSchema["hook"]["$get"]>>().toEqualTypeOf<{ read: true }>();
    expectTypeOf<ExtractResponseType<HookSchema["hook"]["$post"]>>().toEqualTypeOf<{ any: true }>();
    expect(true).toBe(true);
  });

  it("should add one key per method of an app.on() route with several methods", () => {
    expectTypeOf<keyof Schema["items"]["$itemId"]>().toEqualTypeOf<"$put" | "$patch">();
    expectTypeOf<ExtractEndpointType<Schema["items"]["$itemId"]["$patch"]>>().toEqualTypeOf<"/items/:itemId">();
    expect(true).toBe(true);
  });

  it("should add one route per path of an app.on() route with several paths", () => {
    expectTypeOf<ExtractEndpointType<Schema["health"]["$get"]>>().toEqualTypeOf<"/health">();
    expectTypeOf<ExtractEndpointType<Schema["status"]["$get"]>>().toEqualTypeOf<"/status">();
    expectTypeOf<ExtractResponseType<Schema["status"]["$get"]>>().toEqualTypeOf<{ up: true }>();
    expect(true).toBe(true);
  });

  it("should keep a custom method of app.on()", () => {
    const app = new Hono().on("PURGE", "/cache", (c) => c.json({ purged: true as const }));
    type CacheSchema = HonoAppToHyperFetch<typeof app>;

    expectTypeOf<keyof CacheSchema["cache"]>().toEqualTypeOf<"$purge">();
    expect(true).toBe(true);
  });

  it("should merge the methods of two routers mounted on one path", () => {
    expectTypeOf<keyof Schema["shared"]>().toEqualTypeOf<"$get" | "$post">();
    expectTypeOf<ExtractResponseType<Schema["shared"]["$post"]>>().toEqualTypeOf<{ written: true }>();
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

  it("should keep a wildcard segment as a literal * key", () => {
    expectTypeOf<keyof Schema["assets"]>().toEqualTypeOf<"*">();
    expectTypeOf<ExtractEndpointType<Schema["assets"]["*"]["$get"]>>().toEqualTypeOf<"/assets/*">();
    expect(true).toBe(true);
  });

  it("should nest a route deeper than ten segments", () => {
    type Leaf = Schema["l1"]["l2"]["l3"]["l4"]["l5"]["l6"]["l7"]["l8"]["l9"]["l10"]["l11"]["$leaf"]["$get"];

    expectTypeOf<ExtractEndpointType<Leaf>>().toEqualTypeOf<"/l1/l2/l3/l4/l5/l6/l7/l8/l9/l10/l11/:leaf">();
    expectTypeOf<ExtractResponseType<Leaf>>().toEqualTypeOf<{ leaf: string }>();
    expect(true).toBe(true);
  });

  it("should keep the default client below the ten levels createSdk injects its client into", () => {
    const client = createClient({ url: "http://localhost" });
    const sdk = createSdk<typeof client, Schema>(client);
    const shallow = sdk.files.$get;
    const deep = sdk.l1.l2.l3.l4.l5.l6.l7.l8.l9.l10.l11.$leaf.$get;

    expectTypeOf<ExtractClientType<typeof shallow>>().toEqualTypeOf<typeof client>();
    expectTypeOf<ExtractClientType<typeof deep>>().toEqualTypeOf<ClientInstance>();
    deep.setParams({ leaf: "end" });
    // @ts-expect-error - the param is named by the Hono path
    deep.setParams({ id: "end" });
    expect(true).toBe(true);
  });

  it("should flatten routers mounted with an empty path", () => {
    const app = new Hono().basePath("/api/v1").route(
      "/me",
      new Hono().route(
        "",
        new Hono().get("", (c) => c.json({ name: "hono" })),
      ),
    );
    type MeSchema = HonoAppToHyperFetch<typeof app>;

    expectTypeOf<ExtractEndpointType<MeSchema["api"]["v1"]["me"]["$get"]>>().toEqualTypeOf<"/api/v1/me">();
    expect(true).toBe(true);
  });

  it("should prefix routes added after basePath()", () => {
    const app = new Hono().basePath("/api").get("/search", (c) => c.json({ ok: true as const }));
    type SearchSchema = HonoAppToHyperFetch<typeof app>;

    expectTypeOf<ExtractEndpointType<SearchSchema["api"]["search"]["$get"]>>().toEqualTypeOf<"/api/search">();
    expect(true).toBe(true);
  });

  it("should prefix a router mounted after basePath()", () => {
    const book = new Hono().get("/", (c) => c.json({ ok: true as const }));
    const app = new Hono().basePath("/v1").route("/book", book);
    type BookSchema = HonoAppToHyperFetch<typeof app>;

    expectTypeOf<ExtractEndpointType<BookSchema["v1"]["book"]["$get"]>>().toEqualTypeOf<"/v1/book">();
    expect(true).toBe(true);
  });

  it("should accept an app with a typed environment", () => {
    type Env = { Bindings: { TOKEN: string }; Variables: { userId: string } };
    const api = new Hono<Env>().get("/me", (c) => c.json({ userId: c.get("userId") }));
    const app = new Hono<Env>().route("/api", api);
    type EnvSchema = HonoAppToHyperFetch<typeof app>;

    expectTypeOf<ExtractResponseType<EnvSchema["api"]["me"]["$get"]>>().toEqualTypeOf<{ userId: string }>();
    expect(true).toBe(true);
  });
});
