import { parsePartialJSON, repairPartialJSON } from "@hyper-fetch/ai";

describe("parsePartialJSON", () => {
  it("should report undefined input", () => {
    expect(parsePartialJSON(undefined)).toEqual({ value: undefined, state: "undefined-input" });
    expect(parsePartialJSON(null)).toEqual({ value: undefined, state: "undefined-input" });
  });

  it("should parse complete JSON as a successful parse", () => {
    expect(parsePartialJSON('{"a":[1,2,{"b":null}]}')).toEqual({
      value: { a: [1, 2, { b: null }] },
      state: "successful-parse",
    });
  });

  it.each([
    ['{"a":"hel', { a: "hel" }],
    ['{"a":"', { a: "" }],
    ['{"a":', {}],
    ['{"a"', {}],
    ['{"a', {}],
    ["{", {}],
    ['{"a":1,', { a: 1 }],
    ['{"a":1,"b', { a: 1 }],
    ['{"a":12', { a: 12 }],
    ['{"a":1.', { a: 1 }],
    ['{"a":1.5e', { a: 1.5 }],
    ['{"a":-', {}],
    ['{"a":tr', { a: true }],
    ['{"a":fal', { a: false }],
    ['{"a":n', { a: null }],
    ['{"a":[1,2', { a: [1, 2] }],
    ['{"a":[1,2,', { a: [1, 2] }],
    ['{"a":[', { a: [] }],
    ['{"a":[{"b":"x', { a: [{ b: "x" }] }],
    ['{"a":{"b":{"c":[tru', { a: { b: { c: [true] } } }],
    ['{"a":"line\\n', { a: "line\n" }],
    ['{"a":"esc\\', { a: "esc" }],
    ['{"a":"uni\\u00', { a: "uni" }],
    ['{"a":"uni\\u0041', { a: "uniA" }],
    ['{"a":"quote \\"x', { a: 'quote "x' }],
    ['{"a":"{[not structure", "b":[', { a: "{[not structure", b: [] }],
    ['[1,"two",{"three":3},[4', [1, "two", { three: 3 }, [4]]],
    ['"just a str', "just a str"],
    ["12.", 12],
    ["tr", true],
    ['{ "spaced" : [ 1 , 2 ', { spaced: [1, 2] }],
    ['{"emoji":"🚀 zażół', { emoji: "🚀 zażół" }],
  ])("should repair %j", (input, expected) => {
    const result = parsePartialJSON(input);
    expect(result.state).toBe("repaired-parse");
    expect(result.value).toEqual(expected);
  });

  it.each(["", "   ", "-", "{]", "[}", '{"a" 1}', "[1 2]", "nope", '{"a":1}x', '{"a":tx'])(
    "should fail for %j",
    (input) => {
      expect(parsePartialJSON(input)).toEqual({ value: undefined, state: "failed-parse" });
    },
  );

  it("should parse every prefix of a complex document without failing", () => {
    const document = {
      title: 'A "quoted" title with \\ and unicode é 🚀',
      count: -12.5e3,
      flags: [true, false, null],
      nested: {
        list: [
          { id: 1, tags: ["a", "b"] },
          { id: 2, tags: [] },
        ],
        empty: {},
      },
      escapes: "tab\tnew\nline \u0007",
    };
    const text = JSON.stringify(document, null, 1);
    for (let i = 1; i <= text.length; i += 1) {
      const prefix = text.slice(0, i);
      const result = parsePartialJSON(prefix);
      expect(result.state, `prefix ${JSON.stringify(prefix)}`).not.toBe("failed-parse");
    }
    expect(parsePartialJSON(text)).toEqual({ value: document, state: "successful-parse" });
  });

  it("should return only valid JSON from repairPartialJSON for prefixes", () => {
    const text = '{"steps":[{"title":"Plan","done":false},{"title":"Write"';
    for (let i = 1; i <= text.length; i += 1) {
      expect(() => JSON.parse(repairPartialJSON(text.slice(0, i)))).not.toThrow();
    }
  });
});
