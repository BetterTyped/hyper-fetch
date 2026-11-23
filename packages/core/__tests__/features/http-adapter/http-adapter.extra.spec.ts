import type { HttpAdapterExtraType } from "http-adapter";
import { HttpAdapter, httpExtra, xhrExtra } from "http-adapter";

describe("HttpAdapter [ Extra ]", () => {
  it("should start with empty response headers", () => {
    expect(httpExtra).toStrictEqual({ headers: {} });
    expectTypeOf(httpExtra).toEqualTypeOf<HttpAdapterExtraType>();
  });

  it("should use httpExtra as the default and system error extra", () => {
    const adapter = HttpAdapter();

    expect(adapter.defaultExtra).toBe(httpExtra);
    expect(adapter.systemErrorExtra).toBe(httpExtra);
  });

  it("should keep xhrExtra as an alias of httpExtra", () => {
    expect(xhrExtra).toBe(httpExtra);
    expectTypeOf(xhrExtra).toEqualTypeOf<HttpAdapterExtraType>();
  });
});
