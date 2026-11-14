import { createNDJSONParser, parseNDJSON } from "../../../src";

describe("NDJSON parser", () => {
  it("should parse every line", () => {
    expect(parseNDJSON('{"a":1}\n{"b":2}\n3\n"x"\n')).toEqual([{ a: 1 }, { b: 2 }, 3, "x"]);
  });

  it("should skip empty lines and handle CRLF", () => {
    expect(parseNDJSON('\n{"a":1}\r\n\r\n  \n{"b":2}')).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("should parse the trailing line on flush", () => {
    const values: unknown[] = [];
    const parser = createNDJSONParser({ onValue: (value) => values.push(value) });
    parser.feed('{"a":1}\n{"b"');
    expect(values).toEqual([{ a: 1 }]);
    parser.feed(":2}");
    expect(values).toEqual([{ a: 1 }]);
    parser.flush();
    expect(values).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("should produce the same values no matter where the stream is split", () => {
    const text = '{"text":"zażółć"}\n{"n":[1,2,3]}\r\n\n{"end":true}\n';
    for (let i = 0; i <= text.length; i += 1) {
      const values: unknown[] = [];
      const parser = createNDJSONParser({ onValue: (value) => values.push(value) });
      parser.feed(text.slice(0, i));
      parser.feed(text.slice(i));
      parser.flush();
      expect(values).toEqual([{ text: "zażółć" }, { n: [1, 2, 3] }, { end: true }]);
    }
  });

  it("should report invalid lines to onError and keep going", () => {
    const values: unknown[] = [];
    const errors: string[] = [];
    const parser = createNDJSONParser({
      onValue: (value) => values.push(value),
      onError: (_error, line) => errors.push(line),
    });
    parser.feed('{"a":1}\nnot json\n{"b":2}\n');
    expect(values).toEqual([{ a: 1 }, { b: 2 }]);
    expect(errors).toEqual(["not json"]);
  });

  it("should throw invalid lines when onError is not provided", () => {
    const parser = createNDJSONParser({ onValue: () => {} });
    expect(() => parser.feed("{oops}\n")).toThrow("Invalid NDJSON line: {oops}");
  });

  it("should drop buffered text on reset", () => {
    const values: unknown[] = [];
    const parser = createNDJSONParser({ onValue: (value) => values.push(value) });
    parser.feed('{"partial":');
    parser.reset();
    parser.feed('{"fresh":1}\n');
    parser.flush();
    expect(values).toEqual([{ fresh: 1 }]);
  });
});
