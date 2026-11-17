import { parsePartialJSON, repairPartialJSON } from "@hyper-fetch/ai";
import { parsePartialJSON as tanstackParsePartialJSON } from "@tanstack/ai";
import { parsePartialJson as aiSDKParsePartialJson } from "ai";

import { createRandom, isPartialOf, randomJSONDocument } from "./fuzz.utils";

// Fuzz tests do a lot of work in a single test - leave headroom for slow or busy CI machines
vi.setConfig({ testTimeout: 30_000 });

/**
 * Documents the Vercel AI SDK is known to handle differently, left out of the comparison:
 * - `__proto__` / `constructor` keys are refused by its secure JSON parser, HyperFetch keeps them as own keys
 * - an object member like `{"a":2e+3` cut right after the exponent digits is repaired to `2` by `ai` 7.0.173 (it
 *   drops the signed exponent), HyperFetch returns `2000` - the value the complete document has
 */
const isKnownAISDKDifference = (text: string) =>
  text.includes("__proto__") || text.includes("constructor") || /[eE]\+/.test(text);

const HAND_WRITTEN_DOCUMENTS = [
  String.raw`{"title":"A \"quoted\" title","count":-12.5e3,"flags":[true,false,null],"nested":{"list":[{"id":1},{"id":2}],"empty":{}}}`,
  String.raw`[1,"two",{"three":3},[4,[5,[6]]],null,true,false,-0,1e5,"\ud83d\ude00"]`,
  '{"tool":"search","arguments":{"query":"zażółć gęślą jaźń 🚀","limit":10,"filters":{"tags":["a","b"],"after":null}}}',
  ' {\n\t"spaced" : [ 1 , 2 , { "deep" : [ ] } ] ,\r\n "end" : "x"\n} ',
  String.raw`"just a string with \\ escapes \n and \u00e9"`,
  "-123.456e-7",
  "null",
  "[]",
  "{}",
  '{"a":{"b":{"c":{"d":{"e":{"f":"deep"}}}}}}',
];

describe("parsePartialJSON - property and differential tests", () => {
  describe("every prefix of a valid document", () => {
    it.each(HAND_WRITTEN_DOCUMENTS)("should parse every prefix of %j", (text) => {
      const full = JSON.parse(text);
      expect(parsePartialJSON(text)).toEqual({ value: full, state: "successful-parse" });
      for (let length = 0; length < text.length; length += 1) {
        const prefix = text.slice(0, length);
        const result = parsePartialJSON(prefix);
        const hasContent = prefix.trim() !== "" && prefix.trim() !== "-";
        if (hasContent && result.state !== "successful-parse") {
          expect(result.state, JSON.stringify(prefix)).toBe("repaired-parse");
        }
        if (result.state !== "failed-parse") {
          expect(isPartialOf(result.value, full), JSON.stringify(prefix)).toBe(true);
        }
      }
    });

    it("should never throw, never fail and stay consistent for every prefix of 500 random documents", () => {
      const random = createRandom(81);
      // Violations are collected instead of asserted one by one - there are tens of thousands of prefixes
      const violations: string[] = [];
      let prefixes = 0;
      for (let run = 0; run < 500; run += 1) {
        const text = randomJSONDocument(random);
        const full = JSON.parse(text);
        expect(parsePartialJSON(text), `run ${run}: ${JSON.stringify(text)}`).toEqual({
          value: full,
          state: "successful-parse",
        });

        for (let length = 0; length < text.length; length += 1) {
          const prefix = text.slice(0, length);
          const result = parsePartialJSON(prefix);
          const trimmed = prefix.trim();
          prefixes += 1;

          // Nothing to show yet for an empty prefix or a lone minus sign. Everything else must give a value that
          // only contains what the full document contains (a prefix can also be complete: `1` of `12`).
          const isValid =
            trimmed === "" || trimmed === "-"
              ? result.state === "failed-parse" && result.value === undefined
              : result.state !== "failed-parse" && isPartialOf(result.value, full);
          if (!isValid) {
            violations.push(`run ${run}: ${JSON.stringify(prefix)} -> ${JSON.stringify(result)}`);
          }
        }
      }
      expect(violations).toEqual([]);
      expect(prefixes).toBeGreaterThan(20_000);
    });

    it("should only produce valid JSON from repairPartialJSON for every prefix", () => {
      const random = createRandom(98);
      const invalid: string[] = [];
      for (let run = 0; run < 300; run += 1) {
        const text = randomJSONDocument(random);
        for (let length = 0; length <= text.length; length += 1) {
          const prefix = text.slice(0, length);
          const fixed = repairPartialJSON(prefix);
          if (fixed.trim() !== "") {
            try {
              JSON.parse(fixed);
            } catch {
              invalid.push(`run ${run}: ${JSON.stringify(prefix)} -> ${JSON.stringify(fixed)}`);
            }
          }
        }
      }
      expect(invalid).toEqual([]);
    });

    it("should grow objects and arrays monotonically while a document streams in", () => {
      const random = createRandom(115);
      const countMembers = (value: unknown): number => {
        if (Array.isArray(value)) {
          return value.reduce<number>((sum, item) => sum + 1 + countMembers(item), 0);
        }
        if (value !== null && typeof value === "object") {
          return Object.values(value).reduce<number>((sum, item) => sum + 1 + countMembers(item), 0);
        }
        return 0;
      };
      for (let run = 0; run < 300; run += 1) {
        const text = randomJSONDocument(random);
        let previous = 0;
        for (let length = 1; length <= text.length; length += 1) {
          const result = parsePartialJSON(text.slice(0, length));
          if (result.state !== "failed-parse") {
            // Members are only ever added - a longer prefix never shows fewer of them
            const members = countMembers(result.value);
            expect(members, `run ${run}: ${JSON.stringify(text.slice(0, length))}`).toBeGreaterThanOrEqual(previous);
            previous = members;
          }
        }
      }
    });

    it("should be a pure function of the text", () => {
      const random = createRandom(132);
      for (let run = 0; run < 100; run += 1) {
        const text = randomJSONDocument(random);
        const prefix = text.slice(0, random.int(text.length + 1));
        expect(parsePartialJSON(prefix)).toEqual(parsePartialJSON(prefix));
        expect(repairPartialJSON(prefix)).toBe(repairPartialJSON(prefix));
      }
    });
  });

  describe("differential: Vercel AI SDK parsePartialJson", () => {
    it.each(HAND_WRITTEN_DOCUMENTS)("should match for every prefix of %j", async (text) => {
      for (let length = 0; length <= text.length; length += 1) {
        const prefix = text.slice(0, length);
        // eslint-disable-next-line no-await-in-loop
        expect(parsePartialJSON(prefix), JSON.stringify(prefix)).toEqual(await aiSDKParsePartialJson(prefix));
      }
    });

    it("should match for every prefix of 250 random documents", async () => {
      const random = createRandom(149);
      let compared = 0;
      for (let run = 0; run < 250; run += 1) {
        const text = randomJSONDocument(random);
        if (isKnownAISDKDifference(text)) {
          continue;
        }
        for (let length = 0; length <= text.length; length += 1) {
          const prefix = text.slice(0, length);
          // eslint-disable-next-line no-await-in-loop
          const expected = await aiSDKParsePartialJson(prefix);
          expect(parsePartialJSON(prefix), `run ${run}: ${JSON.stringify(prefix)}`).toEqual(expected);
          compared += 1;
        }
      }
      expect(compared).toBeGreaterThan(8000);
    });

    it.each([[undefined]])("should match for %s input", async (input) => {
      expect(parsePartialJSON(input)).toEqual(await aiSDKParsePartialJson(input));
    });

    it("should be stricter than the AI SDK about text after a complete document", async () => {
      // Documented difference: the AI SDK drops trailing garbage, HyperFetch does not call that a JSON prefix
      await expect(aiSDKParsePartialJson('{"a":1}{')).resolves.toEqual({ value: { a: 1 }, state: "repaired-parse" });
      expect(parsePartialJSON('{"a":1}{')).toEqual({ value: undefined, state: "failed-parse" });
    });

    it.each([
      ['{"a":2e+3', { a: 2000 }],
      ['{"a":-2.25E+3', { a: -2250 }],
      ['{"a":1,"b":5e+1', { a: 1, b: 50 }],
      ['[{"a":2E+2', [{ a: 200 }]],
    ])("should keep a signed exponent of an object member in %j", (text, expected) => {
      // `ai` 7.0.173 returns the mantissa only here - the value must be the one the complete document will have
      expect(parsePartialJSON(text)).toEqual({ value: expected, state: "repaired-parse" });
      expect(parsePartialJSON(`${text}}`).value).toEqual(JSON.parse(`${text}${text.startsWith("[") ? "}]" : "}"}`));
    });
  });

  describe("differential: TanStack AI parsePartialJSON", () => {
    /**
     * TanStack AI (the `partial-json` package) is compared on compact `JSON.stringify` output without backslashes
     * only: version 1.4.0 mis-parses some valid documents with whitespace inside empty containers or with a string
     * ending in an escaped backslash, which HyperFetch and JSON.parse handle.
     */
    const compactDocuments = (seed: number, count: number) => {
      const random = createRandom(seed);
      const documents: string[] = [];
      while (documents.length < count) {
        const text = JSON.stringify(JSON.parse(randomJSONDocument(random)));
        if (!text.includes("\\") && !text.includes("__proto__")) {
          documents.push(text);
        }
      }
      return documents;
    };

    it("should match for complete documents", () => {
      compactDocuments(166, 400).forEach((text) => {
        expect(parsePartialJSON(text).value, JSON.stringify(text)).toEqual(tanstackParsePartialJSON(text));
      });
    });

    it("should never show less than TanStack AI for a prefix", () => {
      // partial-json drops unfinished numbers a little earlier, so its value must always be a part of the value
      // HyperFetch returns for the same prefix
      let compared = 0;
      compactDocuments(183, 300).forEach((text) => {
        for (let length = 1; length < text.length; length += 1) {
          const prefix = text.slice(0, length);
          const ours = parsePartialJSON(prefix);
          const theirs: unknown = tanstackParsePartialJSON(prefix);
          if (theirs !== undefined && ours.state !== "failed-parse") {
            if (!isPartialOf(theirs, ours.value)) {
              throw new Error(
                `${JSON.stringify(prefix)} -> ${JSON.stringify(theirs)} vs ${JSON.stringify(ours.value)}`,
              );
            }
            compared += 1;
          }
        }
      });
      expect(compared).toBeGreaterThan(1500);
    });
  });
});
