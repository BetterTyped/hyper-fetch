import { createNDJSONParser, parseNDJSON } from "../../../src";
import { collectNDJSON } from "./stream.fuzz.utils";

describe("NDJSON parser - edge cases", () => {
  describe("values", () => {
    it.each([
      ["null", null],
      ["true", true],
      ["false", false],
      ["0", 0],
      ["-0", -0],
      ["-12.5e3", -12_500],
      ['""', ""],
      ['"text"', "text"],
      ["[]", []],
      ["{}", {}],
      ['[1,"a",null,[{}]]', [1, "a", null, [{}]]],
      ['{"a":{"b":{"c":[true]}}}', { a: { b: { c: [true] } } }],
      ['"zażółć 🚀 日本語"', "zażółć 🚀 日本語"],
      [String.raw`"escaped \n é 😀"`, "escaped \n é 😀"],
      ['"line separator \u2028 inside"', "line separator \u2028 inside"],
    ])("should parse the line %j", (line, expected) => {
      expect(parseNDJSON(`${line}\n`)).toEqual([expected]);
      expect(parseNDJSON(line)).toEqual([expected]);
    });

    it("should keep the order of lines", () => {
      const text = Array.from({ length: 1000 }, (_, index) => `${index}\n`).join("");
      expect(parseNDJSON(text)).toEqual(Array.from({ length: 1000 }, (_, index) => index));
    });

    it("should keep __proto__ as a plain own key", () => {
      const [value] = parseNDJSON<Record<string, unknown>>('{"__proto__":{"polluted":true}}\n');
      expect(Object.keys(value)).toEqual(["__proto__"]);
      expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("should type the values with the generic", () => {
      const values = parseNDJSON<{ id: number }>('{"id":1}\n{"id":2}\n');
      expect(values.map((value) => value.id)).toEqual([1, 2]);
    });
  });

  describe("whitespace and line endings", () => {
    it("should skip blank and whitespace-only lines", () => {
      expect(parseNDJSON("\n\n  \n\t\n\r\n1\n \r\n\n2\n\n\n")).toEqual([1, 2]);
    });

    it("should accept CRLF line endings", () => {
      expect(parseNDJSON('{"a":1}\r\n{"b":2}\r\n')).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it("should accept whitespace around a value", () => {
      expect(parseNDJSON('  {"a" : 1}  \n\t[1, 2]\t\n')).toEqual([{ a: 1 }, [1, 2]]);
    });

    it("should tolerate a byte order mark at the start of the stream", () => {
      expect(parseNDJSON('\uFEFF{"a":1}\n{"b":2}\n')).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it("should return nothing for empty and blank input", () => {
      expect(parseNDJSON("")).toEqual([]);
      expect(parseNDJSON("\n")).toEqual([]);
      expect(parseNDJSON(" \r\n \n")).toEqual([]);
    });

    it("should not treat a lone CR as a line ending", () => {
      const { parser, values, errors } = collectNDJSON({ withOnError: true });
      parser.feed("1\r2\n3\n");
      expect(values).toEqual([3]);
      expect(errors.map(({ line }) => line)).toEqual(["1\r2"]);
    });
  });

  describe("incremental feeding", () => {
    it("should emit a value only when its line is complete", () => {
      const { parser, values } = collectNDJSON();
      parser.feed('{"a"');
      parser.feed(":");
      parser.feed("1}");
      expect(values).toEqual([]);
      parser.feed("\n");
      expect(values).toEqual([{ a: 1 }]);
    });

    it("should emit every complete line of a piece", () => {
      const { parser, values } = collectNDJSON();
      parser.feed("1\n2\n3\n4");
      expect(values).toEqual([1, 2, 3]);
      parser.feed("2\n");
      expect(values).toEqual([1, 2, 3, 42]);
    });

    it("should handle CRLF split between two pieces", () => {
      const { parser, values } = collectNDJSON();
      parser.feed("1\r");
      expect(values).toEqual([]);
      parser.feed("\n2\r");
      expect(values).toEqual([1]);
      parser.feed("\n");
      expect(values).toEqual([1, 2]);
    });

    it("should ignore empty pieces", () => {
      const { parser, values } = collectNDJSON();
      parser.feed("");
      parser.feed("1");
      parser.feed("");
      parser.feed("\n");
      parser.feed("");
      expect(values).toEqual([1]);
    });

    it("should handle a piece that is only a line ending", () => {
      const { parser, values } = collectNDJSON();
      parser.feed("\n");
      parser.feed("\n");
      parser.feed("[1]");
      parser.feed("\n");
      parser.feed("\n");
      expect(values).toEqual([[1]]);
    });
  });

  describe("flush", () => {
    it("should parse the last line without a line ending", () => {
      const { parser, values } = collectNDJSON();
      parser.feed('{"a":1}\n{"b":2}');
      parser.flush();
      expect(values).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it("should do nothing when nothing is buffered", () => {
      const { parser, values } = collectNDJSON();
      parser.flush();
      parser.feed("1\n");
      parser.flush();
      parser.flush();
      expect(values).toEqual([1]);
    });

    it("should not emit the last line twice when flushed twice", () => {
      const { parser, values } = collectNDJSON();
      parser.feed("1\n2");
      parser.flush();
      parser.flush();
      expect(values).toEqual([1, 2]);
    });

    it("should ignore buffered whitespace", () => {
      const { parser, values } = collectNDJSON();
      parser.feed("1\n  \r");
      parser.flush();
      expect(values).toEqual([1]);
    });

    it("should throw for a truncated last line", () => {
      const { parser, values } = collectNDJSON();
      parser.feed('{"a":1}\n{"b":');
      expect(() => parser.flush()).toThrow('Invalid NDJSON line: {"b":');
      expect(values).toEqual([{ a: 1 }]);
    });

    it("should report a truncated last line to onError", () => {
      const { parser, values, errors } = collectNDJSON({ withOnError: true });
      parser.feed('{"a":1}\n{"b":');
      parser.flush();
      expect(values).toEqual([{ a: 1 }]);
      expect(errors.map(({ line }) => line)).toEqual(['{"b":']);
    });

    it("should accept more lines after flush", () => {
      const { parser, values } = collectNDJSON();
      parser.feed("1");
      parser.flush();
      parser.feed("2\n3");
      parser.flush();
      expect(values).toEqual([1, 2, 3]);
    });
  });

  describe("reset", () => {
    it("should drop the buffered partial line", () => {
      const { parser, values } = collectNDJSON();
      parser.feed('1\n{"partial":');
      parser.reset();
      parser.feed("2\n");
      parser.flush();
      expect(values).toEqual([1, 2]);
    });

    it("should be reusable for many streams", () => {
      const { parser, values } = collectNDJSON();
      for (let i = 0; i < 20; i += 1) {
        parser.feed(`${i}\n{"dropped":`);
        parser.reset();
      }
      expect(values).toEqual(Array.from({ length: 20 }, (_, index) => index));
    });

    it("should not throw on flush after reset", () => {
      const { parser, values } = collectNDJSON();
      parser.feed("{broken");
      parser.reset();
      expect(() => parser.flush()).not.toThrow();
      expect(values).toEqual([]);
    });
  });

  describe("invalid lines", () => {
    it.each(["{oops}", "undefined", "NaN", "'single'", "{'a':1}", "[1,]", '{"a":1,}', "1 2", "{}{}", "tru", "//c"])(
      "should reject the line %j",
      (line) => {
        expect(() => parseNDJSON(`${line}\n`)).toThrow(`Invalid NDJSON line: ${line}`);
      },
    );

    it("should throw an Error with the JSON syntax error as the cause", () => {
      const parser = createNDJSONParser({ onValue: () => {} });
      let thrown: unknown;
      try {
        parser.feed("{oops}\n");
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).cause).toBeInstanceOf(SyntaxError);
    });

    it("should pass the trimmed line and the error to onError", () => {
      const reported: { error: Error; line: string }[] = [];
      const parser = createNDJSONParser({
        onValue: () => {},
        onError: (error, line) => reported.push({ error, line }),
      });
      parser.feed("  not json \r\n");
      expect(reported).toHaveLength(1);
      expect(reported[0].line).toBe("not json");
      expect(reported[0].error.message).toBe("Invalid NDJSON line: not json");
      expect(reported[0].error.cause).toBeInstanceOf(SyntaxError);
    });

    it("should shorten long lines in the error message but report the whole line", () => {
      const line = `{${"x".repeat(500)}`;
      const { parser, errors } = collectNDJSON({ withOnError: true });
      parser.feed(`${line}\n`);
      expect(errors[0].line).toBe(line);
      expect(errors[0].message).toBe(`Invalid NDJSON line: ${line.slice(0, 200)}...`);
    });

    it("should not shorten a line of exactly 200 characters", () => {
      const line = `{${"x".repeat(199)}`;
      const { parser, errors } = collectNDJSON({ withOnError: true });
      parser.feed(`${line}\n`);
      expect(errors[0].message).toBe(`Invalid NDJSON line: ${line}`);
    });

    it("should keep parsing the following lines after reporting to onError", () => {
      const { parser, values, errors } = collectNDJSON({ withOnError: true });
      parser.feed("1\nbad\n2\nworse\n3");
      parser.flush();
      expect(values).toEqual([1, 2, 3]);
      expect(errors.map(({ line }) => line)).toEqual(["bad", "worse"]);
    });

    it("should not call onValue for an invalid line", () => {
      const onValue = vi.fn();
      const onError = vi.fn();
      createNDJSONParser({ onValue, onError }).feed("bad\n");
      expect(onValue).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe("failing callbacks", () => {
    it("should consume the invalid line and continue with the next feed", () => {
      const { parser, values } = collectNDJSON();
      expect(() => parser.feed("1\nbad\n2\n3\n")).toThrow("Invalid NDJSON line: bad");
      expect(values).toEqual([1]);
      // The lines that arrived together with the invalid one are not lost
      parser.feed("4\n");
      expect(values).toEqual([1, 2, 3, 4]);
    });

    it("should parse the lines left behind by an invalid line on flush", () => {
      const { parser, values } = collectNDJSON();
      expect(() => parser.feed('bad\n{"a":1}\n{"b":2}\n{"c":')).toThrow("Invalid NDJSON line: bad");
      expect(values).toEqual([]);
      parser.feed("3}");
      parser.flush();
      expect(values).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    });

    it("should throw once per invalid line when several arrive in one piece", () => {
      const { parser, values } = collectNDJSON();
      expect(() => parser.feed("bad1\n1\nbad2\n2\n")).toThrow("Invalid NDJSON line: bad1");
      expect(() => parser.feed("")).not.toThrow();
      expect(() => parser.feed("3\n")).toThrow("Invalid NDJSON line: bad2");
      expect(values).toEqual([1]);
      parser.flush();
      expect(values).toEqual([1, 2, 3]);
    });

    it("should not emit a value again after onValue throws", () => {
      const seen: unknown[] = [];
      let shouldThrow = true;
      const parser = createNDJSONParser({
        onValue: (value) => {
          if (value === 2 && shouldThrow) {
            shouldThrow = false;
            throw new Error("boom");
          }
          seen.push(value);
        },
      });
      expect(() => parser.feed("1\n2\n3\n")).toThrow("boom");
      parser.feed("4\n");
      parser.flush();
      expect(seen).toEqual([1, 3, 4]);
    });

    it("should drop the lines left behind by an invalid line on reset", () => {
      const { parser, values } = collectNDJSON();
      expect(() => parser.feed("bad\n1\n2\n")).toThrow();
      parser.reset();
      parser.feed("3\n");
      parser.flush();
      expect(values).toEqual([3]);
    });
  });

  describe("performance", () => {
    // Each of these takes milliseconds when the parser is linear and far longer than the test timeout when every
    // piece makes it look at everything buffered so far again - a regression shows up as a timeout
    it("should stay linear for one long line arriving in single character pieces", () => {
      const line = JSON.stringify({ text: "x".repeat(500_000) });
      const { parser, values } = collectNDJSON();
      for (const char of line) {
        parser.feed(char);
      }
      parser.feed("\n");
      expect(values).toHaveLength(1);
    });

    it("should parse 100 000 lines fed at once", () => {
      const count = 100_000;
      const text = Array.from({ length: count }, (_, index) => `{"i":${index}}\n`).join("");
      const values = parseNDJSON<{ i: number }>(text);
      expect(values).toHaveLength(count);
      expect(values[count - 1]).toEqual({ i: count - 1 });
    });

    it("should parse a single 2MB line", () => {
      const value = { text: "é".repeat(2_000_000) };
      expect(parseNDJSON(`${JSON.stringify(value)}\n`)).toEqual([value]);
    });
  });
});
