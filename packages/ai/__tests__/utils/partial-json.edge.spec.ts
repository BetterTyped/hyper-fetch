/* eslint-disable unicorn/prefer-string-raw -- the tables below read better as the escaped JSON text they test */
import { parsePartialJSON, repairPartialJSON } from "@hyper-fetch/ai";

const repaired = (value: unknown) => ({ value, state: "repaired-parse" });
const successful = (value: unknown) => ({ value, state: "successful-parse" });
const failed = { value: undefined, state: "failed-parse" };

/** Every prefix of `text` except the empty one and the full text. */
const prefixes = (text: string) => Array.from({ length: text.length - 1 }, (_, index) => text.slice(0, index + 1));

describe("parsePartialJSON - edge cases", () => {
  describe("strings", () => {
    it.each([
      ['"', ""],
      ['"a', "a"],
      ['"a b', "a b"],
      ['"{[,:]}', "{[,:]}"],
      ['"true', "true"],
      ['"12', "12"],
      ['"zażółć 🚀 日本', "zażółć 🚀 日本"],
      ['"a\\', "a"],
      ['"a\\"', 'a"'],
      ['"a\\\\', "a\\"],
      ['"a\\\\\\', "a\\"],
      ['"a\\/', "a/"],
      ['"a\\b\\f\\n\\r\\t', "a\b\f\n\r\t"],
      ['"a\\n', "a\n"],
      ['"a\\u', "a"],
      ['"a\\u0', "a"],
      ['"a\\u00', "a"],
      ['"a\\u004', "a"],
      ['"a\\u0041', "aA"],
      ['"a\\u0041b', "aAb"],
      ['"\\u00e9\\u00E9', "éé"],
      ['"\\ud83d\\ude00', "😀"],
      ['"\\ud83d\\ude0', "\uD83D"],
      ['"\\ud83d\\u', "\uD83D"],
      ['"\\ud83d\\', "\uD83D"],
      ['"\\ud83d', "\uD83D"],
      ['"\\"', '"'],
      ['"\\"\\"', '""'],
      ['"\\\\"', "\\"],
    ])("should close the open string %j as %j", (text, expected) => {
      expect(parsePartialJSON(text)).toEqual(text.endsWith('\\\\"') ? successful(expected) : repaired(expected));
    });

    it("should close a string cut in the middle of a surrogate pair", () => {
      const result = parsePartialJSON<string>('{"emoji":"😀'.slice(0, -1));
      expect(result.state).toBe("repaired-parse");
      expect(result.value).toEqual({ emoji: "\uD83D" });
    });

    it.each(['"a\nb', '"a\tb', '"a\rb', '"\u0000', '"\u001F'])(
      "should fail for the raw control character in %j",
      (text) => {
        expect(parsePartialJSON(text)).toEqual(failed);
        expect(parsePartialJSON(`${text}"`)).toEqual(failed);
      },
    );

    it.each(['"\\x', '"\\a', '"\\0', '"\\u00zz', '"\\uG', '"\\u 0041', "\"\\'"])(
      "should fail for the invalid escape in %j",
      (text) => {
        expect(parsePartialJSON(text)).toEqual(failed);
      },
    );

    it("should allow raw U+2028, U+2029 and DEL inside strings", () => {
      expect(parsePartialJSON('"a\u2028b\u2029c\u007F')).toEqual(repaired("a\u2028b\u2029c\u007F"));
    });

    it("should not treat single quotes as string delimiters", () => {
      expect(parsePartialJSON("'a")).toEqual(failed);
      expect(parsePartialJSON("{'a':1")).toEqual(failed);
    });
  });

  describe("numbers", () => {
    it.each([
      ["[1", [1]],
      ["[12", [12]],
      ["[-1", [-1]],
      ["[-", []],
      ["[0", [0]],
      ["[-0", [-0]],
      ["[0.", [0]],
      ["[0.5", [0.5]],
      ["[1.", [1]],
      ["[1.2", [1.2]],
      ["[1e", [1]],
      ["[1E", [1]],
      ["[1e+", [1]],
      ["[1e-", [1]],
      ["[1e5", [100_000]],
      ["[1E+5", [100_000]],
      ["[1e-2", [0.01]],
      ["[1.5e", [1.5]],
      ["[1.5e+", [1.5]],
      ["[1.5e+1", [15]],
      ["[-1.5E-1", [-0.15]],
      ["[1,-", [1]],
      ["[1,2.", [1, 2]],
      ['{"a":-', {}],
      ['{"a":1.', { a: 1 }],
      ['{"a":1,"b":2e', { a: 1, b: 2 }],
      ["[123456789012345678901234567890", [Number("123456789012345678901234567890")]],
      ["[1e400", [Number.POSITIVE_INFINITY]],
    ])("should keep the valid part of the cut number in %j", (text, expected) => {
      expect(parsePartialJSON(text)).toEqual(repaired(expected));
    });

    it.each([
      ["1", 1],
      ["-1", -1],
      ["0", 0],
      ["1.5", 1.5],
      ["1e5", 100_000],
      ["12 ", 12],
      [" 12", 12],
    ])("should parse the complete root number %j", (text, expected) => {
      expect(parsePartialJSON(text)).toEqual(successful(expected));
    });

    it.each([
      ["1.", 1],
      ["1e", 1],
      ["1e+", 1],
      ["-1.", -1],
      ["0.", 0],
    ])("should repair the cut root number %j", (text, expected) => {
      expect(parsePartialJSON(text)).toEqual(repaired(expected));
    });

    it.each(["-", " -", "- ", "--", "-e", "-.", ".", ".5", "+1", "+", "01", "00", "-01", "1.e5", "0x10", "1_000"])(
      "should fail for %j",
      (text) => {
        expect(parsePartialJSON(text)).toEqual(failed);
      },
    );

    it.each([
      "[01",
      "[00",
      "[-01",
      "[+1",
      "[.5",
      "[1.e5",
      "[1.2.3",
      "[--1",
      "[1 2",
      "[1,+",
      "[NaN",
      "[Infinity",
      "[-Infinity",
    ])("should fail for the invalid number in %j", (text) => {
      expect(parsePartialJSON(text)).toEqual(failed);
    });
  });

  describe("literals", () => {
    it.each([
      ["t", true],
      ["tr", true],
      ["tru", true],
      ["f", false],
      ["fa", false],
      ["fal", false],
      ["fals", false],
      ["n", null],
      ["nu", null],
      ["nul", null],
    ])("should complete the cut literal %j", (text, expected) => {
      expect(parsePartialJSON(text)).toEqual(repaired(expected));
      expect(parsePartialJSON(`[${text}`)).toEqual(repaired([expected]));
      expect(parsePartialJSON(`[1, ${text}`)).toEqual(repaired([1, expected]));
      expect(parsePartialJSON(`{"a":${text}`)).toEqual(repaired({ a: expected }));
      expect(parsePartialJSON(`{"a": [{"b" : ${text}`)).toEqual(repaired({ a: [{ b: expected }] }));
    });

    it.each(["true", "false", "null"])("should parse the complete literal %j", (text) => {
      expect(parsePartialJSON(text)).toEqual(successful(JSON.parse(text)));
      expect(parsePartialJSON(`[${text}`)).toEqual(repaired([JSON.parse(text)]));
    });

    it.each([
      "T",
      "True",
      "TRUE",
      "tR",
      "tx",
      "trux",
      "truex",
      "truee",
      "nulll",
      "nil",
      "none",
      "falsy",
      "undefined",
      "u",
    ])("should fail for %j", (text) => {
      expect(parsePartialJSON(text)).toEqual(failed);
      expect(parsePartialJSON(`[${text}`)).toEqual(failed);
      expect(parsePartialJSON(`{"a":${text}`)).toEqual(failed);
    });

    it("should not complete a literal where a key is expected", () => {
      expect(parsePartialJSON("{t")).toEqual(failed);
      expect(parsePartialJSON('{"a":1,n')).toEqual(failed);
    });
  });

  describe("objects", () => {
    it.each([
      ["{", {}],
      ["{ ", {}],
      ['{"', {}],
      ['{"a', {}],
      ['{"a"', {}],
      ['{"a" ', {}],
      ['{"a":', {}],
      ['{"a": ', {}],
      ['{"a":1', { a: 1 }],
      ['{"a":1 ', { a: 1 }],
      ['{"a":1,', { a: 1 }],
      ['{"a":1, ', { a: 1 }],
      ['{"a":1,"', { a: 1 }],
      ['{"a":1,"b', { a: 1 }],
      ['{"a":1,"b"', { a: 1 }],
      ['{"a":1,"b":', { a: 1 }],
      ['{"a":1,"b":"', { a: 1, b: "" }],
      ['{"a":{', { a: {} }],
      ['{"a":{"b":{"c":{', { a: { b: { c: {} } } }],
      ['{"a":{}', { a: {} }],
      ['{"a":{},', { a: {} }],
      ['{"a":{},"b":[', { a: {}, b: [] }],
      ['{"":', {}],
      ['{"":1', { "": 1 }],
      ['{"a\\"b":1', { 'a"b': 1 }],
      ['{"\\u0061":1', { a: 1 }],
      ['{"a\\', {}],
      ['{"a\\u00', {}],
      ['{"a b":{"c d":"e f', { "a b": { "c d": "e f" } }],
    ])("should repair %j", (text, expected) => {
      expect(parsePartialJSON(text)).toEqual(repaired(expected));
    });

    it("should keep the last value of a repeated key, like JSON.parse", () => {
      expect(parsePartialJSON('{"a":1,"a":2,"a":3')).toEqual(repaired({ a: 3 }));
    });

    it.each([
      "{,",
      '{"a":1,}',
      '{"a":1,,',
      '{"a"}',
      '{"a" 1',
      '{"a"::',
      '{"a":1 "b"',
      '{"a":1:',
      "{1",
      "{[",
      "{{",
      '{"a":}',
      "{]",
    ])("should fail for %j", (text) => {
      expect(parsePartialJSON(text)).toEqual(failed);
    });
  });

  describe("arrays", () => {
    it.each([
      ["[", []],
      ["[ ", []],
      ["[[", [[]]],
      ["[[]", [[]]],
      ["[[],", [[]]],
      ["[[],[", [[], []]],
      ["[1,", [1]],
      ["[1, ", [1]],
      ["[1,2", [1, 2]],
      ['["a","b', ["a", "b"]],
      ['[{"a":1},{"a":', [{ a: 1 }, {}]],
      ["[null,", [null]],
      ["[[[[[[", [[[[[[]]]]]]],
      ["[[1],[2,[3", [[1], [2, [3]]]],
    ])("should repair %j", (text, expected) => {
      expect(parsePartialJSON(text)).toEqual(repaired(expected));
    });

    it.each(["[,", "[1,]", "[1,,", "[1 2", "[}", "[1}", "[:", '["a":'])("should fail for %j", (text) => {
      expect(parsePartialJSON(text)).toEqual(failed);
    });
  });

  describe("whitespace", () => {
    it("should accept JSON whitespace between all tokens", () => {
      expect(parsePartialJSON(' \t\r\n{ \t\r\n"a" \t\r\n: \t\r\n[ \t\r\n1 \t\r\n, \t\r\n2 \t\r\n')).toEqual(
        repaired({ a: [1, 2] }),
      );
    });

    it.each(["", " ", "\n", "\t\r\n  "])("should fail for the blank input %j", (text) => {
      expect(parsePartialJSON(text)).toEqual(failed);
    });

    it.each(["\u00A0{", "\uFEFF{", "\u2028[", "\u000B[", "\u000C["])(
      "should not accept the non-JSON whitespace in %j",
      (text) => {
        expect(parsePartialJSON(text)).toEqual(failed);
      },
    );

    it("should keep whitespace inside strings", () => {
      expect(parsePartialJSON('{"a":"  x  ')).toEqual(repaired({ a: "  x  " }));
    });
  });

  describe("input that is not a JSON prefix", () => {
    it.each([
      "nope",
      "undefined",
      "NaN",
      "{]",
      "[}",
      "}",
      "]",
      ",",
      ":",
      "//",
      "/* c */ {",
      "<html>",
      "```json\n{",
      "data: {",
      '{"a":1}x',
      '{"a":1}{',
      '{"a":1}\n{"b":2',
      "[]]",
      "{}}",
      '"a""b',
      "1 2",
      "null null",
      "true,",
    ])("should fail for %j", (text) => {
      expect(parsePartialJSON(text)).toEqual(failed);
    });

    it("should return the input unchanged from repairPartialJSON", () => {
      ["nope", "{]", '{"a":1}x', "[1 2", "tx", '"\\u00zz'].forEach((text) => {
        expect(repairPartialJSON(text)).toBe(text);
      });
    });

    it("should never throw for arbitrary input", () => {
      // Strings of 4 characters from a small alphabet of JSON tokens - a deterministic slice of all combinations
      const characters = [...'{}[]",:\\ \n-+.eEtrufalsn0123456789xu\0\uD83D😀'];
      const states = new Set(["successful-parse", "repaired-parse", "failed-parse"]);
      const check = (text: string): string | undefined => {
        try {
          const result = parsePartialJSON(text);
          repairPartialJSON(text);
          const isValid = states.has(result.state) && (result.state !== "failed-parse" || result.value === undefined);
          return isValid ? undefined : `${JSON.stringify(text)} -> ${JSON.stringify(result)}`;
        } catch (error) {
          return `${JSON.stringify(text)} threw ${String(error)}`;
        }
      };

      const violations: string[] = [];
      let checked = 0;
      for (let a = 0; a < characters.length; a += 1) {
        for (let b = 0; b < characters.length; b += 1) {
          for (let c = 0; c < characters.length; c += 3) {
            const text = characters[a] + characters[b] + characters[c] + characters[(a + b + c) % characters.length];
            const violation = check(text);
            if (violation) {
              violations.push(violation);
            }
            checked += 1;
          }
        }
      }
      expect(violations).toEqual([]);
      expect(checked).toBeGreaterThan(15_000);
    });
  });

  describe("states", () => {
    it.each([[undefined], [null]])("should report %s input", (input) => {
      expect(parsePartialJSON(input)).toEqual({ value: undefined, state: "undefined-input" });
    });

    it("should report a complete document as successful and every proper prefix as repaired", () => {
      const text = '{"a":[1,{"b":"c"},null],"d":true}';
      expect(parsePartialJSON(text)).toEqual(successful({ a: [1, { b: "c" }, null], d: true }));
      prefixes(text).forEach((prefix) => {
        expect(parsePartialJSON(prefix).state, prefix).toBe("repaired-parse");
      });
    });

    it("should report a complete document with surrounding whitespace as successful", () => {
      expect(parsePartialJSON(' \n{"a":1}\n ')).toEqual(successful({ a: 1 }));
    });

    it("should report complete root primitives as successful", () => {
      expect(parsePartialJSON('"text"')).toEqual(successful("text"));
      expect(parsePartialJSON("null")).toEqual(successful(null));
      expect(parsePartialJSON("0")).toEqual(successful(0));
    });

    it("should return value undefined for every failed parse", () => {
      expect(parsePartialJSON("{]").value).toBeUndefined();
      expect("value" in parsePartialJSON("{]")).toBe(true);
    });
  });

  describe("repairPartialJSON", () => {
    it.each([
      ['{"a":"hel', '{"a":"hel"}'],
      ['{"a":1,"b', '{"a":1}'],
      ['{"a":1,', '{"a":1}'],
      ["[tr", "[true]"],
      ["[1, nu", "[1, null]"],
      ['{"a":[1,2', '{"a":[1,2]}'],
      ['{"a":"x\\', '{"a":"x"}'],
      ['{"a":"x\\u12', '{"a":"x"}'],
      ["[1.", "[1]"],
      ["[-", "[]"],
      ["", ""],
      ["   ", ""],
      ["-", ""],
      ['{"a":1}', '{"a":1}'],
      ['  {"a" : 1', '  {"a" : 1}'],
    ])("should turn %j into %j", (text, expected) => {
      expect(repairPartialJSON(text)).toBe(expected);
    });

    it("should not change a complete document", () => {
      const text = JSON.stringify({ a: [1, "two", { three: null }], b: -1.5e-3, c: "é\n" });
      expect(repairPartialJSON(text)).toBe(text);
    });
  });

  describe("security", () => {
    it("should keep __proto__ as a plain own key and never touch prototypes", () => {
      const result = parsePartialJSON<Record<string, unknown>>(
        '{"__proto__":{"polluted":true},"a":{"__proto__":{"x":1',
      );
      expect(result.state).toBe("repaired-parse");
      const value = result.value as Record<string, unknown>;
      expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
      expect(Object.hasOwn(value, "__proto__")).toBe(true);
      expect(value.polluted).toBeUndefined();
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect(({} as Record<string, unknown>).x).toBeUndefined();
    });

    it("should treat constructor and prototype as ordinary keys", () => {
      expect(parsePartialJSON('{"constructor":{"prototype":{"polluted":tr')).toEqual(
        repaired({ constructor: { prototype: { polluted: true } } }),
      );
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  });

  describe("deep nesting and large input", () => {
    it.each([10, 1000, 20_000])("should repair %i unclosed arrays", (depth) => {
      const result = parsePartialJSON("[".repeat(depth));
      expect(result.state).toBe("repaired-parse");
      let cursor = result.value as unknown[];
      let levels = 1;
      while (cursor.length > 0) {
        cursor = cursor[0] as unknown[];
        levels += 1;
      }
      expect(levels).toBe(depth);
    });

    it.each([10, 1000, 20_000])("should repair %i unclosed objects", (depth) => {
      const result = parsePartialJSON(`${'{"k":'.repeat(depth)}"leaf`);
      expect(result.state).toBe("repaired-parse");
      let cursor = result.value as Record<string, unknown> | string;
      let levels = 0;
      while (typeof cursor !== "string") {
        cursor = cursor.k as Record<string, unknown> | string;
        levels += 1;
      }
      expect(levels).toBe(depth);
      expect(cursor).toBe("leaf");
    });

    it("should repair a 2MB open string", () => {
      const text = `{"text":"${"zażółć ".repeat(300_000)}`;
      const result = parsePartialJSON<{ text: string }>(text);
      expect(result.state).toBe("repaired-parse");
      expect(result.value?.text).toHaveLength(2_100_000);
    });

    it("should repair a document with 20 000 members cut at the end", () => {
      const items = Array.from({ length: 20_000 }, (_, id) => ({ id, name: `item ${id}`, ok: id % 2 === 0 }));
      const text = JSON.stringify({ items });
      const result = parsePartialJSON<{ items: typeof items }>(text.slice(0, -12));
      expect(result.state).toBe("repaired-parse");
      expect(result.value?.items).toHaveLength(20_000);
      expect(result.value?.items.slice(0, -1)).toEqual(items.slice(0, -1));
    });

    it("should repair a very long number", () => {
      const result = parsePartialJSON<number[]>(`[${"9".repeat(100_000)}`);
      expect(result).toEqual(repaired([Number.POSITIVE_INFINITY]));
    });
  });
});
