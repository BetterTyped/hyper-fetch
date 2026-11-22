import { createClient, createSdk } from "@hyper-fetch/core";
import type {
  ExtractEndpointType,
  ExtractLocalErrorType,
  ExtractPayloadType,
  ExtractQueryParamsType,
  ExtractResponseType,
} from "@hyper-fetch/core";
import { Elysia } from "elysia";
import { expectTypeOf } from "vitest";

import type { ElysiaSchema } from "../../../src";
import type { edgeApp, rootParamApp } from "../../utils/edge-app";

type Schema = ElysiaSchema<typeof edgeApp>;

type ValidationError = { type: "validation" };

describe("ElysiaSchema [ Paths ]", () => {
  it("should keep every HTTP route and leave out the mounted handler", () => {
    expectTypeOf<keyof Schema>().toEqualTypeOf<
      | "$get"
      | "level"
      | "search"
      | "number"
      | "true"
      | "null"
      | "void"
      | "date"
      | "generator"
      | "asyncGenerator"
      | "sse"
      | "stream"
      | "response"
      | "redirect"
      | "form"
      | "teapot"
      | "multipleChoices"
      | "schemaStatuses"
      | "secret"
      | "head"
      | "options"
      | "deep"
      | "string"
      | "array"
      | "optionalBody"
      | "unionBody"
      | "dateBody"
      | "upload"
      | "uploads"
      | "noSchema"
      | "empty"
      | "queryTypes"
      | "queryLiteral"
      | "queryArray"
      | "queryPartial"
      | "queryOptional"
      | "queryUnknown"
      | "queryEmpty"
      | "guarded"
      | "nested"
      | "params"
      | "headers"
      | "throws"
      | "a"
      | "jsonSerializationDeserialization"
      | "any"
      | "optionalFile"
      | "anySchema"
    >();
    expect(true).toBe(true);
  });

  it("should put a route registered on an empty path at the top level", () => {
    expectTypeOf<ExtractEndpointType<Schema["$get"]>>().toEqualTypeOf<"/">();
    expectTypeOf<ExtractResponseType<Schema["$get"]>>().toEqualTypeOf<"root">();
    expect(true).toBe(true);
  });

  it("should put the / route of a prefixed plugin on the prefix", () => {
    expectTypeOf<keyof Schema["level"]>().toEqualTypeOf<"$get" | "level" | "$id">();
    expectTypeOf<ExtractEndpointType<Schema["level"]["$get"]>>().toEqualTypeOf<"/level">();
    expectTypeOf<ExtractResponseType<Schema["level"]["$get"]>>().toEqualTypeOf<"level-index">();
    expectTypeOf<ExtractEndpointType<Schema["level"]["level"]["$get"]>>().toEqualTypeOf<"/level/level">();
    expectTypeOf<ExtractEndpointType<Schema["level"]["$id"]["ok"]["$get"]>>().toEqualTypeOf<"/level/:id/ok">();
    expect(true).toBe(true);
  });

  it("should treat a segment named index as a regular segment", () => {
    expectTypeOf<
      ExtractEndpointType<Schema["search"]["index"]["$indexId"]["stocks"]["$get"]>
    >().toEqualTypeOf<"/search/index/:indexId/stocks">();
    expect(true).toBe(true);
  });

  it("should camelCase a segment with several hyphens", () => {
    expectTypeOf<
      ExtractEndpointType<Schema["jsonSerializationDeserialization"]["$get"]>
    >().toEqualTypeOf<"/json-serialization-deserialization">();
    expect(true).toBe(true);
  });

  it("should keep segments named like keywords and literals", () => {
    expectTypeOf<ExtractEndpointType<Schema["number"]["$get"]>>().toEqualTypeOf<"/number">();
    expectTypeOf<ExtractEndpointType<Schema["true"]["$get"]>>().toEqualTypeOf<"/true">();
    expectTypeOf<ExtractEndpointType<Schema["null"]["$get"]>>().toEqualTypeOf<"/null">();
    expectTypeOf<ExtractEndpointType<Schema["void"]["$get"]>>().toEqualTypeOf<"/void">();
    expect(true).toBe(true);
  });

  it("should nest deep paths", () => {
    expectTypeOf<
      ExtractEndpointType<Schema["deep"]["nested"]["mirror"]["$post"]>
    >().toEqualTypeOf<"/deep/nested/mirror">();
    expect(true).toBe(true);
  });

  it("should nest a group with an empty guard", () => {
    expectTypeOf<ExtractEndpointType<Schema["nested"]["data"]["$get"]>>().toEqualTypeOf<"/nested/data">();
    expectTypeOf<ExtractResponseType<Schema["nested"]["data"]["$get"]>>().toEqualTypeOf<{ nested: true }>();
    expect(true).toBe(true);
  });

  it("should put a root param at the top level", () => {
    type RootSchema = ElysiaSchema<typeof rootParamApp>;

    expectTypeOf<keyof RootSchema>().toEqualTypeOf<"$id">();
    expectTypeOf<ExtractEndpointType<RootSchema["$id"]["$get"]>>().toEqualTypeOf<"/:id">();
    expect(true).toBe(true);
  });

  it("should type a param from the path even when a params schema transforms it", () => {
    expectTypeOf<ExtractEndpointType<Schema["params"]["$count"]["$get"]>>().toEqualTypeOf<"/params/:count">();
    expectTypeOf<ExtractResponseType<Schema["params"]["$count"]["$get"]>>().toEqualTypeOf<{ count: number }>();
    expect(true).toBe(true);
  });

  it("should resolve paths up to the depth createSdk injects its client into", () => {
    const sdk = createSdk<ReturnType<typeof createClient>, Schema>(createClient({ url: "http://localhost" }));

    expectTypeOf<
      ExtractEndpointType<Schema["a"]["b"]["c"]["d"]["e"]["f"]["g"]["h"]["$get"]>
    >().toEqualTypeOf<"/a/b/c/d/e/f/g/h">();
    expectTypeOf<ExtractResponseType<typeof sdk.a.b.c.d.e.f.g.h.$get>>().toEqualTypeOf<{ depth: 8 }>();
    expect(true).toBe(true);
  });

  it("should leave out paths with ten or more segments", () => {
    const deep = new Elysia()
      .get("/1/2/3/4/5/6/7/8/9", () => 9 as const)
      .get("/a/2/3/4/5/6/7/8/9/10", () => 10 as const);
    type DeepSchema = ElysiaSchema<typeof deep>;

    expectTypeOf<ExtractResponseType<DeepSchema[1][2][3][4][5][6][7][8][9]["$get"]>>().toEqualTypeOf<9>();
    expectTypeOf<keyof DeepSchema>().toEqualTypeOf<"1">();
    expect(true).toBe(true);
  });

  it("should map the HEAD and OPTIONS methods", () => {
    expectTypeOf<keyof Schema["head"]>().toEqualTypeOf<"$head">();
    expectTypeOf<keyof Schema["options"]>().toEqualTypeOf<"$options">();
    expect(true).toBe(true);
  });
});

describe("ElysiaSchema [ Responses ]", () => {
  it("should keep literal and primitive responses", () => {
    expectTypeOf<ExtractResponseType<Schema["number"]["$get"]>>().toEqualTypeOf<1>();
    expectTypeOf<ExtractResponseType<Schema["true"]["$get"]>>().toEqualTypeOf<boolean>();
    expect(true).toBe(true);
  });

  it("should type null as the empty body Elysia sends", () => {
    expectTypeOf<ExtractResponseType<Schema["null"]["$get"]>>().toEqualTypeOf<"">();
    expect(true).toBe(true);
  });

  it("should type a handler without a return value or returning any as unknown", () => {
    expectTypeOf<ExtractResponseType<Schema["void"]["$get"]>>().toBeUnknown();
    expectTypeOf<ExtractResponseType<Schema["any"]["$get"]>>().toBeUnknown();
    expectTypeOf<ExtractLocalErrorType<Schema["void"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should keep a response schema of any as any", () => {
    expectTypeOf<ExtractResponseType<Schema["anySchema"]["$get"]>>().toBeAny();
    expect(true).toBe(true);
  });

  it("should type dates as the ISO strings JSON carries", () => {
    expectTypeOf<ExtractResponseType<Schema["date"]["$get"]>>().toEqualTypeOf<{ date: string; history: string[] }>();
    expect(true).toBe(true);
  });

  it("should type bodies that are not JSON as unknown", () => {
    expectTypeOf<ExtractResponseType<Schema["generator"]["$get"]>>().toBeUnknown();
    expectTypeOf<ExtractResponseType<Schema["asyncGenerator"]["$get"]>>().toBeUnknown();
    expectTypeOf<ExtractResponseType<Schema["sse"]["$get"]>>().toBeUnknown();
    expectTypeOf<ExtractResponseType<Schema["stream"]["$get"]>>().toBeUnknown();
    expectTypeOf<ExtractResponseType<Schema["response"]["$get"]>>().toBeUnknown();
    expectTypeOf<ExtractResponseType<Schema["redirect"]["$get"]>>().toBeUnknown();
    expectTypeOf<ExtractResponseType<Schema["form"]["$get"]>>().toBeUnknown();
    expect(true).toBe(true);
  });

  it("should type a status passed by name", () => {
    expectTypeOf<ExtractResponseType<Schema["teapot"]["$get"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractLocalErrorType<Schema["teapot"]["$get"]>>().toEqualTypeOf<{ readonly brewing: false }>();
    expect(true).toBe(true);
  });

  it("should type a 3xx status as an error", () => {
    expectTypeOf<ExtractResponseType<Schema["multipleChoices"]["$get"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractLocalErrorType<Schema["multipleChoices"]["$get"]>>().toEqualTypeOf<{
      readonly choices: readonly ["a", "b"];
    }>();
    expect(true).toBe(true);
  });

  it("should split a response schema into the response and the local error", () => {
    type SchemaError = ExtractLocalErrorType<Schema["schemaStatuses"]["$get"]>;

    expectTypeOf<ExtractResponseType<Schema["schemaStatuses"]["$get"]>>().toEqualTypeOf<"">();
    expectTypeOf<Exclude<SchemaError, ValidationError>>().toEqualTypeOf<"teapot" | "calm">();
    expectTypeOf<Extract<SchemaError, ValidationError>>().not.toBeNever();
    expect(true).toBe(true);
  });

  it("should not type headers, which requests set with setHeaders", () => {
    expectTypeOf<ExtractPayloadType<Schema["headers"]["$get"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractQueryParamsType<Schema["headers"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should leave errors a handler throws to the global error of the client", () => {
    expectTypeOf<ExtractLocalErrorType<Schema["throws"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should add the status a macro resolves with to the local error", () => {
    expectTypeOf<ExtractResponseType<Schema["secret"]["$get"]>>().toEqualTypeOf<{ userId: string }>();
    expectTypeOf<ExtractLocalErrorType<Schema["secret"]["$get"]>>().toEqualTypeOf<{ readonly reason: "forbidden" }>();
    expect(true).toBe(true);
  });
});

describe("ElysiaSchema [ Payloads ]", () => {
  it("should resolve a body schema referenced by its model name", () => {
    expectTypeOf<ExtractPayloadType<Schema["deep"]["nested"]["mirror"]["$post"]>>().toEqualTypeOf<{
      username: string;
      password: string;
    }>();
    expect(true).toBe(true);
  });

  it("should type primitive, array, optional and union bodies", () => {
    expectTypeOf<ExtractPayloadType<Schema["string"]["$post"]>>().toEqualTypeOf<string>();
    expectTypeOf<ExtractPayloadType<Schema["array"]["$post"]>>().toEqualTypeOf<string[]>();
    expectTypeOf<ExtractPayloadType<Schema["optionalBody"]["$post"]>>().toEqualTypeOf<{ note?: string } | null>();
    expectTypeOf<ExtractPayloadType<Schema["unionBody"]["$post"]>>().toEqualTypeOf<{ a: string } | { b: number }>();
    expect(true).toBe(true);
  });

  it("should accept a Date where the body schema reads one", () => {
    expectTypeOf<ExtractPayloadType<Schema["dateBody"]["$post"]>>().toEqualTypeOf<{ date: Date }>();
    expect(true).toBe(true);
  });

  it("should type a body with file fields as FormData", () => {
    expectTypeOf<ExtractPayloadType<Schema["upload"]["$post"]>>().toEqualTypeOf<FormData>();
    expectTypeOf<ExtractPayloadType<Schema["uploads"]["$post"]>>().toEqualTypeOf<FormData>();
    expectTypeOf<ExtractPayloadType<Schema["optionalFile"]["$post"]>>().toEqualTypeOf<FormData>();
    expect(true).toBe(true);
  });

  it("should leave the payload undefined without a body schema", () => {
    expectTypeOf<ExtractPayloadType<Schema["noSchema"]["$post"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractPayloadType<Schema["empty"]["$delete"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should leave the payload undefined on routes that use status() or a macro", () => {
    expectTypeOf<ExtractPayloadType<Schema["teapot"]["$get"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractPayloadType<Schema["secret"]["$get"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractPayloadType<Schema["head"]["$head"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });
});

describe("ElysiaSchema [ Query params ]", () => {
  it("should type transformed, literal and array query fields", () => {
    expectTypeOf<ExtractQueryParamsType<Schema["queryTypes"]["$get"]>>().toEqualTypeOf<{
      day: Date;
      count: number;
      note?: string;
    }>();
    expectTypeOf<ExtractQueryParamsType<Schema["queryLiteral"]["$get"]>>().toEqualTypeOf<{ alias: "Kristen" }>();
    expectTypeOf<ExtractQueryParamsType<Schema["queryArray"]["$get"]>>().toEqualTypeOf<{ tags: string[] }>();
    expect(true).toBe(true);
  });

  it("should type partial and optional query schemas with optional fields", () => {
    expectTypeOf<ExtractQueryParamsType<Schema["queryPartial"]["$get"]>>().toEqualTypeOf<{ page?: string }>();
    expectTypeOf<ExtractQueryParamsType<Schema["queryOptional"]["$get"]>>().toEqualTypeOf<{ page?: string }>();
    expect(true).toBe(true);
  });

  it("should leave the query params undefined for unknown and empty query schemas", () => {
    expectTypeOf<ExtractQueryParamsType<Schema["queryUnknown"]["$get"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractQueryParamsType<Schema["queryEmpty"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should type the query a guard adds to its routes", () => {
    expectTypeOf<ExtractQueryParamsType<Schema["guarded"]["$get"]>>().toEqualTypeOf<{ token: string }>();
    expect(true).toBe(true);
  });
});

describe("ElysiaSchema [ createSdk inputs ]", () => {
  const client = createClient({ url: "http://localhost" });
  const sdk = createSdk<typeof client, Schema>(client);

  it("should accept string and number params", () => {
    sdk.params.$count.$get.setParams({ count: 1 });
    sdk.params.$count.$get.setParams({ count: "1" });
    // @ts-expect-error - the path names the param count
    sdk.params.$count.$get.setParams({ amount: 1 });
    expect(true).toBe(true);
  });

  it("should take FormData for a body with files", () => {
    sdk.upload.$post.setPayload(new FormData());
    // @ts-expect-error - a file can not be sent as JSON
    sdk.upload.$post.setPayload({ title: "a", file: new Blob() });
    expect(true).toBe(true);
  });

  it("should reject query values the schema does not accept", () => {
    sdk.queryLiteral.$get.setQueryParams({ alias: "Kristen" });
    // @ts-expect-error - the schema only accepts the literal
    sdk.queryLiteral.$get.setQueryParams({ alias: "Other" });
    expect(true).toBe(true);
  });
});
