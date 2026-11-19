import { expectTypeOf } from "vitest";

import { Adapter } from "adapter";
import { createClient } from "client";
import { HttpMethods } from "constants/http.constants";
import type { ExtractAdapterType, ExtractUnionAdapter } from "types";

const createCustomAdapter = () =>
  new Adapter({
    name: "custom-adapter",
    defaultMethod: HttpMethods.GET,
    defaultExtra: {},
    systemErrorStatus: 0,
    systemErrorExtra: {},
  });

type CustomAdapter = ReturnType<typeof createCustomAdapter>;

describe("Adapter [ TypeScript ]", () => {
  describe("when selecting the adapter of a request", () => {
    it("should keep a single adapter without comparing it", () => {
      // A single adapter is returned as it is - comparing its whole class is too deep for tsgo
      expectTypeOf<ExtractUnionAdapter<CustomAdapter, { method: "unknown" }>>().toEqualTypeOf<CustomAdapter>();
    });

    it("should type requests of a client with a custom adapter", () => {
      const adapter = createCustomAdapter();
      const client = createClient({ url: "https://api.test.com" }).setAdapter(adapter);
      const request = client.createRequest<{ response: { id: number } }>()({ endpoint: "/users/:userId" });

      expectTypeOf<ExtractAdapterType<typeof request>>().toEqualTypeOf<CustomAdapter>();
    });
  });
});
