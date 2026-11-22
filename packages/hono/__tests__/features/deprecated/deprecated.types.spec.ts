import { expectTypeOf } from "vitest";

import type {
  HonoAppToHyperFetch,
  HonoSchema,
  HonoSocketPath,
  HonoWebSocketPath,
} from "../../../src";
import type { app } from "../../utils/app";
import type { RealtimeApp } from "../../utils/realtime-server";

describe("Hono [ Deprecated names ]", () => {
  it("should keep HonoAppToHyperFetch as an alias of HonoSchema", () => {
    expectTypeOf<HonoAppToHyperFetch<typeof app>>().toEqualTypeOf<
      HonoSchema<typeof app>
    >();
    expect(true).toBe(true);
  });

  it("should keep HonoWebSocketPath as an alias of HonoSocketPath", () => {
    expectTypeOf<HonoWebSocketPath<RealtimeApp>>().toEqualTypeOf<
      HonoSocketPath<RealtimeApp>
    >();
    expect(true).toBe(true);
  });
});
