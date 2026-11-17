import { createNDJSONParser, parseNDJSON } from "../../../src";
import type { RandomType } from "./stream.fuzz.utils";
import { createRandom, decodeByteChunks, randomJSONValue, randomPieces, runNDJSON, splitAt } from "./stream.fuzz.utils";

// Fuzz tests do a lot of work in a single test - leave headroom for slow or busy CI machines
vi.setConfig({ testTimeout: 30_000 });

type DocumentType = { text: string; values: unknown[]; invalid: string[] };

const SEPARATORS = ["\n", "\n", "\n", "\r\n", "\n\n", "\r\n\r\n", "\n \n", "\n\t\r\n"];
const INVALID_LINES = ["{oops}", "nope", '{"a":', "[1,2", "'x'", "1 2", "}"];

/** Random NDJSON body with blank lines, padded lines, CRLF and (optionally) invalid lines. */
const randomDocument = (
  random: RandomType,
  { invalidLines = false }: { invalidLines?: boolean } = {},
): DocumentType => {
  const values: unknown[] = [];
  const invalid: string[] = [];
  let text = random.chance(0.2) ? random.pick(SEPARATORS) : "";
  const count = random.int(8);
  for (let i = 0; i < count; i += 1) {
    let line: string;
    if (invalidLines && random.chance(0.25)) {
      line = random.pick(INVALID_LINES);
      invalid.push(line);
    } else {
      const value = randomJSONValue(random);
      values.push(value);
      line = JSON.stringify(value);
    }
    const padding = random.chance(0.2) ? random.pick([" ", "\t", "  "]) : "";
    const isLast = i === count - 1;
    // The last line may come without a line ending - it is parsed on flush
    text += padding + line + padding + (isLast && random.chance(0.5) ? "" : random.pick(SEPARATORS));
  }
  return { text, values, invalid };
};

describe("NDJSON parser - chunk boundary fuzzing", () => {
  it("should parse 1000 random documents like JSON.parse on every line", () => {
    const random = createRandom(11);
    for (let run = 0; run < 1000; run += 1) {
      const { text, values } = randomDocument(random);
      expect(parseNDJSON(text), `run ${run}: ${JSON.stringify(text)}`).toEqual(values);
    }
  });

  it("should not depend on where 300 random documents are cut in two", () => {
    const random = createRandom(22);
    for (let run = 0; run < 300; run += 1) {
      const { text, values } = randomDocument(random);
      for (let offset = 0; offset <= text.length; offset += 1) {
        expect(runNDJSON(splitAt(text, [offset])), `run ${run}, cut at ${offset}: ${JSON.stringify(text)}`).toEqual({
          values,
          errors: [],
        });
      }
    }
  });

  it("should not depend on any pair of cuts", () => {
    const text = '{"text":"zażółć 🚀"}\r\n\n[1,2,3]\n \n"x"\r\nnull';
    const values = [{ text: "zażółć 🚀" }, [1, 2, 3], "x", null];
    for (let first = 0; first <= text.length; first += 1) {
      for (let second = first; second <= text.length; second += 1) {
        expect(runNDJSON(splitAt(text, [first, second])), `cuts at ${first}, ${second}`).toEqual({
          values,
          errors: [],
        });
      }
    }
  });

  it("should parse 500 random documents one character at a time", () => {
    const random = createRandom(33);
    for (let run = 0; run < 500; run += 1) {
      const { text, values } = randomDocument(random);
      // Splitting by UTF-16 code unit on purpose - surrogate pairs are cut in half
      const pieces = Array.from({ length: text.length }, (_, index) => text[index]);
      expect(runNDJSON(pieces), `run ${run}: ${JSON.stringify(text)}`).toEqual({ values, errors: [] });
    }
  });

  it.each([2, 3, 7, 32])("should parse 300 random documents in random pieces of up to %i characters", (maxSize) => {
    const random = createRandom(44 + maxSize);
    for (let run = 0; run < 300; run += 1) {
      const { text, values } = randomDocument(random);
      const pieces = randomPieces(text, { random, maxSize });
      expect(runNDJSON(pieces), `run ${run}: ${JSON.stringify(pieces)}`).toEqual({ values, errors: [] });
    }
  });

  it("should not depend on where the UTF-8 bytes are cut", () => {
    const random = createRandom(55);
    for (let run = 0; run < 60; run += 1) {
      const { text, values } = randomDocument(random);
      const { length } = new TextEncoder().encode(text);
      for (let offset = 0; offset <= length; offset += 1) {
        expect(
          runNDJSON(decodeByteChunks(text, [offset])),
          `run ${run}, byte cut at ${offset}: ${JSON.stringify(text)}`,
        ).toEqual({ values, errors: [] });
      }
    }
  });

  it("should parse multi-byte text delivered one byte at a time", () => {
    const values = [{ text: "zażółć gęślą jaźń" }, "🚀 日本語 👨‍👩‍👧‍👦", { "klucz ü": ["é", "ß"] }];
    const text = values.map((value) => `${JSON.stringify(value)}\r\n`).join("");
    const { length } = new TextEncoder().encode(text);
    const offsets = Array.from({ length: length - 1 }, (_, index) => index + 1);
    expect(runNDJSON(decodeByteChunks(text, offsets))).toEqual({ values, errors: [] });
  });

  it("should report the same invalid lines wherever the stream is cut", () => {
    const random = createRandom(66);
    for (let run = 0; run < 200; run += 1) {
      const { text, values, invalid } = randomDocument(random, { invalidLines: true });
      const expectedErrors = invalid.map((line) => ({ message: `Invalid NDJSON line: ${line}`, line }));
      for (let offset = 0; offset <= text.length; offset += 1) {
        expect(runNDJSON(splitAt(text, [offset])), `run ${run}, cut at ${offset}: ${JSON.stringify(text)}`).toEqual({
          values,
          errors: expectedErrors,
        });
      }
    }
  });

  it("should deliver every valid line when invalid lines throw and feeding continues", () => {
    const random = createRandom(77);
    for (let run = 0; run < 300; run += 1) {
      const { text, values, invalid } = randomDocument(random, { invalidLines: true });
      const received: unknown[] = [];
      const thrown: string[] = [];
      const parser = createNDJSONParser({ onValue: (value) => received.push(value) });

      // A piece is consumed even when it throws: the invalid line is dropped and whatever followed it stays
      // buffered for the next feed or flush
      randomPieces(text, { random, maxSize: 9 }).forEach((piece) => {
        try {
          parser.feed(piece);
        } catch (error) {
          thrown.push((error as Error).message);
        }
      });
      for (let attempt = 0; attempt <= invalid.length; attempt += 1) {
        try {
          parser.flush();
          break;
        } catch (error) {
          thrown.push((error as Error).message);
        }
      }

      const context = `run ${run}: ${JSON.stringify(text)}`;
      expect(received, context).toEqual(values);
      expect(thrown, context).toEqual(invalid.map((line) => `Invalid NDJSON line: ${line}`));
    }
  });
});
