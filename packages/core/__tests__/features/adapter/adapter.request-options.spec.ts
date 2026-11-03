import type { AdapterInstance, DeclareAdapterType, DefaultMapperType, QueryParamsType } from "adapter";
import { Adapter } from "adapter";
import { Client } from "client";
import type { stringifyQueryParams } from "http-adapter";
import type { ExtractAdapterRequestOptionsType } from "types";
import { expectTypeOf } from "vitest";

import { HttpMethods } from "../../../src/constants/http.constants";

type CustomRequestOptions = { document?: string };

const createAdapter = () =>
  new Adapter<
    { timeout?: number },
    "GET",
    number,
    { headers: Record<string, string> },
    QueryParamsType | string,
    undefined,
    string,
    (endpoint: string) => string,
    typeof stringifyQueryParams,
    DefaultMapperType,
    DefaultMapperType,
    CustomRequestOptions
  >({
    name: "test-adapter",
    defaultMethod: HttpMethods.GET,
    defaultExtra: { headers: {} },
    systemErrorStatus: 0,
    systemErrorExtra: { headers: {} },
  });

describe("Adapter [ Request options ]", () => {
  describe("when creating requests", () => {
    it("should keep the additional field in the request options", () => {
      const client = new Client({ url: "http://localhost" }).setAdapter(createAdapter());

      const request = client.createRequest()({ endpoint: "/test", document: "value" });

      expect(request.requestOptions).toMatchObject({ endpoint: "/test", document: "value" });
    });

    it("should keep the additional field on clones and after serialization", () => {
      const client = new Client({ url: "http://localhost" }).setAdapter(createAdapter());

      const request = client.createRequest()({ endpoint: "/test", document: "value" });
      const cloned = request.setRetry(1).clone();
      const restored = client.fromJSON(JSON.parse(JSON.stringify(request.toJSON())));

      expect(cloned.requestOptions).toMatchObject({ document: "value" });
      expect(restored.requestOptions).toMatchObject({ document: "value" });
    });
  });

  describe("when using the devtools endpoint getter", () => {
    it("should allow to read the request options", () => {
      const adapter = createAdapter().setDevtoolsEndpointGetter(
        (endpoint, requestOptions) => requestOptions?.document ?? endpoint,
      );

      expect(adapter.unstable_devtoolsEndpointGetter("/test")).toBe("/test");
      expect(adapter.unstable_devtoolsEndpointGetter("/test", { document: "value" })).toBe("value");
    });
  });

  describe("when checking types", () => {
    it("should extract the declared request options", () => {
      type TestAdapter = ReturnType<typeof createAdapter>;

      expectTypeOf<ExtractAdapterRequestOptionsType<TestAdapter>>().toEqualTypeOf<CustomRequestOptions>();
    });

    it("should support declaring the request options", () => {
      type Declared = DeclareAdapterType<{
        adapterOptions: Record<string, never>;
        methodType: "GET";
        statusType: number;
        extra: Record<string, never>;
        endpointType: string;
        requestOptions: CustomRequestOptions;
      }>;

      expectTypeOf<ExtractAdapterRequestOptionsType<Declared>>().toEqualTypeOf<CustomRequestOptions>();
    });

    it("should default to no additional fields", () => {
      type Default = DeclareAdapterType<{
        adapterOptions: Record<string, never>;
        methodType: "GET";
        statusType: number;
        extra: Record<string, never>;
        endpointType: string;
      }>;

      expectTypeOf<ExtractAdapterRequestOptionsType<Default>>().toEqualTypeOf<{}>();
      expectTypeOf<ExtractAdapterRequestOptionsType<AdapterInstance>>().toEqualTypeOf<{}>();
    });

    it("should reject not declared fields and validate the declared ones", () => {
      const client = new Client({ url: "http://localhost" }).setAdapter(createAdapter());
      const http = new Client({ url: "http://localhost" });

      const create = () => {
        // @ts-expect-error wrong type of the declared field
        client.createRequest()({ endpoint: "/test", document: 1 });
        // @ts-expect-error field not declared by the adapter
        client.createRequest()({ endpoint: "/test", other: 1 });
        // @ts-expect-error field not declared by the default adapter
        http.createRequest()({ endpoint: "/test", document: "value" });
      };

      expect(create).toBeFunction();
    });
  });
});
