import { createClient, createSdk } from "@hyper-fetch/core";
import type { ExtractPayloadType, ExtractQueryParamsType, ExtractResponseType } from "@hyper-fetch/core";
import { expectTypeOf } from "vitest";

import type { HonoAppToHyperFetch } from "../../../src";
import type { inputsApp } from "../../utils/inputs.app";

type Schema = HonoAppToHyperFetch<typeof inputsApp>;

describe("HonoAppToHyperFetch [ Validator inputs ]", () => {
  it("should take the payload from the json validator, optional fields included", () => {
    expectTypeOf<ExtractPayloadType<Schema["posts"]["$post"]>>().toEqualTypeOf<{ title: string; draft?: boolean }>();
    expect(true).toBe(true);
  });

  it("should take the query params from an untyped query validator", () => {
    expectTypeOf<ExtractQueryParamsType<Schema["search"]["$get"]>>().toEqualTypeOf<{
      [key: string]: string | string[];
    }>();
    expect(true).toBe(true);
  });

  it("should leave the payload undefined for a form validator", () => {
    expectTypeOf<ExtractPayloadType<Schema["upload"]["$post"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should leave header and cookie validators out of the request", () => {
    expectTypeOf<ExtractPayloadType<Schema["whoami"]["$get"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractQueryParamsType<Schema["whoami"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should combine param, json and query validators on one route", () => {
    type Update = Schema["posts"]["$postId"]["$put"];

    expectTypeOf<ExtractPayloadType<Update>>().toEqualTypeOf<{ title: string; draft?: boolean }>();
    expectTypeOf<ExtractQueryParamsType<Update>>().toEqualTypeOf<{ notify: string | string[] }>();
    expectTypeOf<ExtractResponseType<Update>>().toEqualTypeOf<{
      title: string;
      draft?: boolean;
      postId: number;
      notify: boolean;
    }>();
    expect(true).toBe(true);
  });

  it("should add the response a validator returns to the route response", () => {
    expectTypeOf<ExtractResponseType<Schema["strict"]["$post"]>>().toEqualTypeOf<
      { name: string } | { error: "Name is required" }
    >();
    expect(true).toBe(true);
  });
});

describe("HonoAppToHyperFetch [ Validator inputs on createSdk ]", () => {
  const client = createClient({ url: "http://localhost" });
  const sdk = createSdk<typeof client, Schema>(client);

  it("should accept a payload without its optional fields", () => {
    sdk.posts.$post.setPayload({ title: "Hello" });
    sdk.posts.$post.setPayload({ title: "Hello", draft: true });
    // @ts-expect-error - draft is a boolean
    sdk.posts.$post.setPayload({ title: "Hello", draft: "yes" });
    expect(true).toBe(true);
  });

  it("should accept arrays in the query params", () => {
    sdk.search.$get.setQueryParams({ q: "hono", tags: ["a", "b"] });
    // @ts-expect-error - query values are strings or string arrays
    sdk.search.$get.setQueryParams({ page: 1 });
    expect(true).toBe(true);
  });

  it("should take the params of a param validator from the Hono path", () => {
    sdk.posts.$postId.$put.setParams({ postId: "1" });
    // @ts-expect-error - the Hono path names the param postId
    sdk.posts.$postId.$put.setParams({ id: "1" });
    expect(true).toBe(true);
  });

  it("should reject a payload on a form route", () => {
    // @ts-expect-error - the payload of a form route is undefined
    sdk.upload.$post.setPayload(new FormData());
    expect(true).toBe(true);
  });
});
