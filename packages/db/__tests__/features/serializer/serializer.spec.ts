import { createSerializer } from "@hyper-fetch/db";

describe("db [ Serializer ]", () => {
  const serializer = createSerializer();
  const roundTrip = (value: unknown) => serializer.parse(serializer.stringify(value));

  it("brings back values JSON loses", () => {
    const value = {
      date: new Date("2026-11-21T10:00:00.000Z"),
      big: 12_345_678_901_234_567_890n,
      map: new Map<unknown, unknown>([
        [1, "one"],
        ["nested", new Set([new Date(0)])],
      ]),
      set: new Set(["a", "b"]),
      missing: undefined,
      nan: Number.NaN,
      inf: Infinity,
      negInf: -Infinity,
      list: [undefined, 1, null, "x"],
      invalid: new Date(Number.NaN),
    };
    const restored = roundTrip(value) as typeof value;
    expect(restored).toStrictEqual(value);
    expect(restored.date).toBeInstanceOf(Date);
    expect(Object.keys(restored)).toContain("missing");
  });

  it("keeps absent fields absent and keeps numeric and string keys apart", () => {
    const restored = roundTrip({
      rows: [
        [1, { id: 1 }],
        ["1", { id: "1" }],
      ],
      only: { a: 1 },
    }) as {
      rows: [unknown, unknown][];
      only: object;
    };
    expect(restored.rows.map(([key]) => typeof key)).toStrictEqual(["number", "string"]);
    expect(Object.keys(restored.only)).toStrictEqual(["a"]);
  });

  it("never reads a plain object that has the tag key as a tagged value", () => {
    const value = { $hf: "Date", v: 1, other: { $hf: "undefined" } };
    expect(roundTrip(value)).toStrictEqual(value);
  });

  it("stores other types through codecs and fails clearly for an unknown tag", () => {
    class Money {
      constructor(readonly cents: number) {}
    }
    const withCodec = createSerializer([
      {
        name: "Money",
        test: (value) => value instanceof Money,
        encode: (value) => (value as Money).cents,
        decode: (value) => new Money(value as number),
      },
    ]);
    const restored = withCodec.parse(withCodec.stringify({ price: new Money(250) })) as { price: Money };
    expect(restored.price).toBeInstanceOf(Money);
    expect(restored.price.cents).toBe(250);
    expect(() => serializer.parse(withCodec.stringify(new Money(1)))).toThrow(
      'No codec decodes stored values tagged "Money"',
    );
  });

  it("leaves plain JSON as it is", () => {
    expect(serializer.stringify({ a: [1, "b", true, null] })).toBe('{"a":[1,"b",true,null]}');
    expect(roundTrip(Object.create(null))).toStrictEqual({});
  });
});
