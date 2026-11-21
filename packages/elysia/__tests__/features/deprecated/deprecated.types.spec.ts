import { expectTypeOf } from "vitest";

import type { ElysiaAppToHyperFetch, ElysiaSchema } from "../../../src";
import type { app } from "../../utils/app";

describe("Elysia [ Deprecated names ]", () => {
  it("should keep ElysiaAppToHyperFetch as an alias of ElysiaSchema", () => {
    expectTypeOf<ElysiaAppToHyperFetch<typeof app>>().toEqualTypeOf<
      ElysiaSchema<typeof app>
    >();
    expect(true).toBe(true);
  });
});
