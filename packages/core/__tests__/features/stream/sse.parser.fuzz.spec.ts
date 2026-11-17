import { parseSSE } from "../../../src";
import {
  collectSSE,
  createRandom,
  decodeByteChunks,
  randomPieces,
  randomSSEStream,
  referenceSSE,
  runSSE,
  splitAt,
} from "./stream.fuzz.utils";

// Fuzz tests do a lot of work in a single test - leave headroom for slow or busy CI machines
vi.setConfig({ testTimeout: 30_000 });

type ReferenceParserType = {
  createParser: (callbacks: {
    onEvent?: (event: { id?: string; event?: string; data: string }) => void;
    onComment?: (comment: string) => void;
  }) => { feed: (chunk: string) => void };
};

// `eventsource-parser` is the parser used by the Vercel AI SDK. It is not a dependency of this package - it is only
// compared against when the workspace has it installed (it comes with the `ai` package).
const referenceModule = "eventsource-parser";
const reference: ReferenceParserType | null = await import(/* @vite-ignore */ referenceModule).then(
  (module) => module as ReferenceParserType,
  () => null,
);

/** A handful of streams covering every documented feature, used for the exhaustive (every offset) tests */
const HAND_WRITTEN_STREAMS = [
  'event: delta\r\nid: 1\r\ndata: {"a":1}\r\n\r\n: comment\ndata: x\ndata: y\r\rdata: zażółć 🚀\n\n',
  "\uFEFFdata: bom\n\ndata: after\n\n",
  "data: a\r\n\r\ndata: b\r\rdata: c\n\ndata: unterminated",
  "id: 1\ndata: a\n\nid: \0\ndata: b\n\nid\ndata: c\n\n",
  "retry: 10\ndata: a\n\nretry: x\ndata: b\n\nretry: 5\n\ndata: c\n\n",
  ": only comments\r\n:\r\n: more\r\n",
  "data\ndata\n\ndata:\n\nevent\ndata: e\n\n",
  "event: 😀\ndata: 😀😀\nid: 😀\n\n",
  "\r\n\r\n\r\ndata: after blank lines\r\n\r\n\r\n",
  "data: trailing cr\r",
  "data: a\n\r\ndata: b\r\n\n",
  "",
  "\n",
  "\r",
  "\r\n",
  "\uFEFF",
  "data",
];

describe("SSE parser - chunk boundary fuzzing", () => {
  describe("reference implementation", () => {
    it.each(HAND_WRITTEN_STREAMS)("should match the spec reference for %j", (text) => {
      expect(runSSE([text])).toEqual(referenceSSE(text));
      expect(runSSE([text], { flush: false })).toEqual(referenceSSE(text, { flush: false }));
    });

    it("should match the spec reference for 2000 random streams", () => {
      const random = createRandom(12_648_430);
      for (let run = 0; run < 2000; run += 1) {
        const text = randomSSEStream(random);
        expect(runSSE([text]), `run ${run}: ${JSON.stringify(text)}`).toEqual(referenceSSE(text));
        expect(runSSE([text], { flush: false }), `run ${run} (no flush): ${JSON.stringify(text)}`).toEqual(
          referenceSSE(text, { flush: false }),
        );
      }
    });

    it("should return the same events from parseSSE as from the incremental parser", () => {
      const random = createRandom(7);
      for (let run = 0; run < 300; run += 1) {
        const text = randomSSEStream(random);
        expect(parseSSE(text), JSON.stringify(text)).toEqual(runSSE([text]).events);
      }
    });
  });

  describe("two pieces", () => {
    it.each(HAND_WRITTEN_STREAMS)("should not depend on where %j is cut in two", (text) => {
      const expected = referenceSSE(text);
      for (let offset = 0; offset <= text.length; offset += 1) {
        expect(runSSE(splitAt(text, [offset])), `cut at ${offset}`).toEqual(expected);
      }
    });

    it("should not depend on where 300 random streams are cut in two", () => {
      const random = createRandom(101);
      for (let run = 0; run < 300; run += 1) {
        const text = randomSSEStream(random);
        const expected = referenceSSE(text);
        for (let offset = 0; offset <= text.length; offset += 1) {
          expect(runSSE(splitAt(text, [offset])), `run ${run}, cut at ${offset}: ${JSON.stringify(text)}`).toEqual(
            expected,
          );
        }
      }
    });

    it("should dispatch the same events before flush wherever the stream is cut", () => {
      const random = createRandom(202);
      for (let run = 0; run < 200; run += 1) {
        const text = randomSSEStream(random);
        const expected = referenceSSE(text, { flush: false });
        for (let offset = 0; offset <= text.length; offset += 1) {
          expect(
            runSSE(splitAt(text, [offset]), { flush: false }),
            `run ${run}, cut at ${offset}: ${JSON.stringify(text)}`,
          ).toEqual(expected);
        }
      }
    });
  });

  describe("three pieces", () => {
    it.each(HAND_WRITTEN_STREAMS.filter((text) => text.length <= 60))(
      "should not depend on any pair of cuts in %j",
      (text) => {
        const expected = referenceSSE(text);
        for (let first = 0; first <= text.length; first += 1) {
          for (let second = first; second <= text.length; second += 1) {
            expect(runSSE(splitAt(text, [first, second])), `cuts at ${first}, ${second}`).toEqual(expected);
          }
        }
      },
    );
  });

  describe("many pieces", () => {
    it.each(HAND_WRITTEN_STREAMS)("should parse %j one character at a time", (text) => {
      // Splitting by UTF-16 code unit on purpose - surrogate pairs are cut in half
      const pieces = Array.from({ length: text.length }, (_, index) => text[index]);
      expect(runSSE(pieces)).toEqual(referenceSSE(text));
    });

    it("should parse 500 random streams one character at a time", () => {
      const random = createRandom(303);
      for (let run = 0; run < 500; run += 1) {
        const text = randomSSEStream(random, { lines: 30 });
        const pieces = Array.from({ length: text.length }, (_, index) => text[index]);
        expect(runSSE(pieces), `run ${run}: ${JSON.stringify(text)}`).toEqual(referenceSSE(text));
      }
    });

    it.each([2, 3, 5, 8, 21, 64])(
      "should parse 300 random streams in random pieces of up to %i characters",
      (maxSize) => {
        const random = createRandom(404 + maxSize);
        for (let run = 0; run < 300; run += 1) {
          const text = randomSSEStream(random, { lines: 40 });
          const pieces = randomPieces(text, { random, maxSize });
          expect(runSSE(pieces), `run ${run}: ${JSON.stringify(pieces)}`).toEqual(referenceSSE(text));
        }
      },
    );

    it("should ignore empty pieces anywhere in the stream", () => {
      const random = createRandom(505);
      for (let run = 0; run < 200; run += 1) {
        const text = randomSSEStream(random);
        const pieces = randomPieces(text, { random, maxSize: 4 }).flatMap((piece) =>
          random.chance(0.5) ? ["", piece, ""] : [piece],
        );
        expect(runSSE(["", ...pieces, ""]), `run ${run}: ${JSON.stringify(pieces)}`).toEqual(referenceSSE(text));
      }
    });
  });

  describe("byte level chunks", () => {
    const utf8Length = (text: string) => new TextEncoder().encode(text).length;

    it.each(HAND_WRITTEN_STREAMS)("should not depend on where the UTF-8 bytes of %j are cut", (text) => {
      const expected = referenceSSE(text);
      const length = utf8Length(text);
      for (let offset = 0; offset <= length; offset += 1) {
        expect(runSSE(decodeByteChunks(text, [offset])), `byte cut at ${offset}`).toEqual(expected);
      }
    });

    it("should parse multi-byte text delivered one byte at a time", () => {
      const text = "\uFEFFevent: żółw\r\ndata: zażółć gęślą jaźń\r\ndata: 🚀 日本語 👨‍👩‍👧‍👦\r\nid: ü\r\n\r\ndata: ok\n\n";
      const offsets = Array.from({ length: utf8Length(text) - 1 }, (_, index) => index + 1);
      expect(runSSE(decodeByteChunks(text, offsets))).toEqual(referenceSSE(text));
      expect(runSSE(decodeByteChunks(text, offsets)).events).toEqual([
        { event: "żółw", data: "zażółć gęślą jaźń\n🚀 日本語 👨‍👩‍👧‍👦", id: "ü" },
        { event: "message", data: "ok", id: "ü" },
      ]);
    });

    it("should parse 200 random streams in random byte chunks", () => {
      const random = createRandom(606);
      for (let run = 0; run < 200; run += 1) {
        const text = randomSSEStream(random, { lines: 30 });
        const length = utf8Length(text);
        const offsets: number[] = [];
        for (let offset = 1 + random.int(5); offset < length; offset += 1 + random.int(5)) {
          offsets.push(offset);
        }
        expect(runSSE(decodeByteChunks(text, offsets)), `run ${run}: ${JSON.stringify(text)}`).toEqual(
          referenceSSE(text),
        );
      }
    });
  });

  describe("reuse", () => {
    it("should parse every stream like a fresh parser after reset", () => {
      const random = createRandom(707);
      const { parser, result } = collectSSE();
      for (let run = 0; run < 300; run += 1) {
        const text = randomSSEStream(random);
        result.events.length = 0;
        result.comments.length = 0;
        randomPieces(text, { random, maxSize: 6 }).forEach((piece) => parser.feed(piece));
        if (random.chance(0.5)) {
          parser.flush();
          expect(result, `run ${run}: ${JSON.stringify(text)}`).toEqual(referenceSSE(text));
        } else {
          expect(result, `run ${run} (no flush): ${JSON.stringify(text)}`).toEqual(
            referenceSSE(text, { flush: false }),
          );
        }
        parser.reset();
      }
    });
  });

  describe.skipIf(!reference)("differential: eventsource-parser", () => {
    /**
     * `eventsource-parser` reports the raw fields of every event, while this parser follows the EventSource
     * semantics (type defaults to "message", the last event id persists). Only what both agree to expose is
     * compared: the type, the data and the comments. Streams must end with a blank line - the reference never
     * dispatches an unterminated event - and must not start with a BOM, which it only strips from binary strings.
     */
    const runReference = (pieces: readonly string[]) => {
      const events: { event: string; data: string }[] = [];
      const comments: string[] = [];
      const parser = (reference as ReferenceParserType).createParser({
        onEvent: (event) => events.push({ event: event.event ?? "message", data: event.data }),
        onComment: (comment) => comments.push(comment),
      });
      pieces.forEach((piece) => parser.feed(piece));
      return { events, comments };
    };

    const runOurs = (pieces: readonly string[]) => {
      const { events, comments } = runSSE(pieces, { flush: false });
      return { events: events.map(({ event, data }) => ({ event, data })), comments };
    };

    const terminated = (text: string) => `${text}\n\n`;

    it.each(HAND_WRITTEN_STREAMS.filter((text) => !text.startsWith("\uFEFF")))(
      "should dispatch the same events for %j",
      (text) => {
        expect(runOurs([terminated(text)])).toEqual(runReference([terminated(text)]));
      },
    );

    it("should dispatch the same events for 2000 random streams", () => {
      const random = createRandom(808);
      for (let run = 0; run < 2000; run += 1) {
        const text = terminated(randomSSEStream(random, { lines: 30, bom: false }));
        expect(runOurs([text]), `run ${run}: ${JSON.stringify(text)}`).toEqual(runReference([text]));
      }
    });

    it("should dispatch the same events for 500 random streams in random pieces", () => {
      const random = createRandom(909);
      for (let run = 0; run < 500; run += 1) {
        const text = terminated(randomSSEStream(random, { lines: 30, bom: false }));
        const pieces = randomPieces(text, { random, maxSize: 7 });
        expect(runOurs(pieces), `run ${run}: ${JSON.stringify(pieces)}`).toEqual(runReference(pieces));
      }
    });

    it("should dispatch the same events for a realistic LLM token stream", () => {
      let text = "";
      for (let i = 0; i < 500; i += 1) {
        text += `event: text-delta\ndata: ${JSON.stringify({ type: "text-delta", id: "t1", delta: `token ${i} 🚀` })}\n\n`;
        if (i % 50 === 0) {
          text += ": keep-alive\n\n";
        }
      }
      text += "data: [DONE]\n\n";
      const random = createRandom(1010);
      const pieces = randomPieces(text, { random, maxSize: 97 });
      const ours = runOurs(pieces);
      expect(ours).toEqual(runReference(pieces));
      expect(ours.events).toHaveLength(501);
      expect(ours.comments).toHaveLength(10);
    });
  });
});
