import type { ExtractResponseType } from "@hyper-fetch/core";
import { Hono } from "hono";
import type { ApplyGlobalResponse, PickResponseByStatusCode } from "hono/client";
import { expectTypeOf } from "vitest";

import type { HonoSchema } from "../../../src";
import type { Result, responsesApp } from "../../utils/responses.app";

type Schema = HonoSchema<typeof responsesApp>;

describe("HonoSchema [ JSON responses ]", () => {
  it("should keep the literal type of JSON primitives", () => {
    expectTypeOf<ExtractResponseType<Schema["json"]["string"]["$get"]>>().toEqualTypeOf<"a-string">();
    expectTypeOf<ExtractResponseType<Schema["json"]["number"]["$get"]>>().toEqualTypeOf<37>();
    expectTypeOf<ExtractResponseType<Schema["json"]["boolean"]["$get"]>>().toEqualTypeOf<true>();
    expect(true).toBe(true);
  });

  it("should type null and empty object bodies", () => {
    expectTypeOf<ExtractResponseType<Schema["json"]["null"]["$get"]>>().toEqualTypeOf<null>();
    expectTypeOf<ExtractResponseType<Schema["json"]["empty"]["$get"]>>().toEqualTypeOf<{}>();
    expect(true).toBe(true);
  });

  it("should type dates as the strings JSON turns them into", () => {
    expectTypeOf<ExtractResponseType<Schema["json"]["date"]["$get"]>>().toEqualTypeOf<{ at: string }>();
    expect(true).toBe(true);
  });

  it("should keep interfaces with optional fields", () => {
    expectTypeOf<ExtractResponseType<Schema["json"]["interface"]["$get"]>>().toEqualTypeOf<Result[]>();
    expect(true).toBe(true);
  });

  it("should union the bodies of every branch", () => {
    expectTypeOf<ExtractResponseType<Schema["json"]["union"]["$get"]>>().toEqualTypeOf<
      { data: string } | { message: string }
    >();
    expect(true).toBe(true);
  });

  it("should type a body JSON cannot serialize as never", () => {
    const app = new Hono().get("/bigint", (c) => c.json({ value: 42n }));
    type BigIntSchema = HonoSchema<typeof app>;

    expectTypeOf<ExtractResponseType<BigIntSchema["bigint"]["$get"]>>().toBeNever();
    expect(true).toBe(true);
  });
});

describe("HonoSchema [ Statuses ]", () => {
  it("should union the bodies of every status", () => {
    expectTypeOf<ExtractResponseType<Schema["statuses"]["$get"]>>().toEqualTypeOf<
      { data: string } | { message: string }
    >();
    expect(true).toBe(true);
  });

  it("should add the response a middleware returns", () => {
    expectTypeOf<ExtractResponseType<Schema["guarded"]["$post"]>>().toEqualTypeOf<
      { created: true } | { error: "Unauthorized" }
    >();
    expect(true).toBe(true);
  });

  it("should keep only the statuses PickResponseByStatusCode picks", () => {
    type SuccessSchema = HonoSchema<PickResponseByStatusCode<typeof responsesApp, 200>>;

    expectTypeOf<ExtractResponseType<SuccessSchema["statuses"]["$get"]>>().toEqualTypeOf<{ data: string }>();
    expect(true).toBe(true);
  });

  it("should add the responses ApplyGlobalResponse declares", () => {
    type GlobalSchema = HonoSchema<
      ApplyGlobalResponse<typeof responsesApp, { 500: { json: { error: string } } }>
    >;

    expectTypeOf<ExtractResponseType<GlobalSchema["json"]["number"]["$get"]>>().toEqualTypeOf<37 | { error: string }>();
    expect(true).toBe(true);
  });
});

describe("HonoSchema [ Other response helpers ]", () => {
  it("should type c.text() with the literal text", () => {
    expectTypeOf<ExtractResponseType<Schema["text"]["$get"]>>().toEqualTypeOf<"Hello, Hono!">();
    expectTypeOf<ExtractResponseType<Schema["text"]["numeric"]["$get"]>>().toEqualTypeOf<"42">();
    expect(true).toBe(true);
  });

  it("should type c.body() with the body it sends", () => {
    expectTypeOf<ExtractResponseType<Schema["body"]["$get"]>>().toEqualTypeOf<"raw body">();
    expectTypeOf<ExtractResponseType<Schema["body"]["empty"]["$delete"]>>().toEqualTypeOf<null>();
    expectTypeOf<ExtractResponseType<Schema["body"]["null"]["$get"]>>().toEqualTypeOf<null>();
    expect(true).toBe(true);
  });

  it("should type c.redirect() as undefined", () => {
    expectTypeOf<ExtractResponseType<Schema["redirect"]["$get"]>>().toEqualTypeOf<{ stayed: true } | undefined>();
    expect(true).toBe(true);
  });

  it("should type untyped responses as an empty object", () => {
    expectTypeOf<ExtractResponseType<Schema["newResponse"]["$get"]>>().toEqualTypeOf<{}>();
    expectTypeOf<ExtractResponseType<Schema["notFound"]["$get"]>>().toEqualTypeOf<{}>();
    expect(true).toBe(true);
  });
});
