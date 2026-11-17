import type { ServerSentEventType, StreamParserType } from "../../../src";
import { createNDJSONParser, createSSEParser } from "../../../src";

/**
 * Deterministic pseudo random generator. Fuzz tests must never use `Math.random` - the same seed always
 * produces the same sequence, so a failure can be reproduced from the seed printed in the assertion message.
 */
export const createRandom = (seed: number) => {
  // Park-Miller "minimal standard" generator: every product stays below 2^53, so plain number math is exact
  const modulus = 2_147_483_647;
  let state = (Math.abs(Math.trunc(seed)) % (modulus - 1)) + 1;

  const next = () => {
    state = (state * 48_271) % modulus;
    return (state - 1) / (modulus - 1);
  };
  const int = (max: number) => Math.floor(next() * max);

  return {
    next,
    /** Integer in `[0, max)` */
    int,
    pick: <T>(items: readonly T[]): T => items[int(items.length)],
    chance: (probability: number) => next() < probability,
  };
};

export type RandomType = ReturnType<typeof createRandom>;

/** Cut `text` into pieces at the given sorted offsets. */
export const splitAt = (text: string, offsets: readonly number[]): string[] => {
  const pieces: string[] = [];
  let start = 0;
  offsets.forEach((offset) => {
    pieces.push(text.slice(start, offset));
    start = offset;
  });
  pieces.push(text.slice(start));
  return pieces;
};

/** Random pieces of 1..maxSize UTF-16 code units - cuts land inside CRLF pairs, field names and surrogate pairs. */
export const randomPieces = (text: string, { random, maxSize }: { random: RandomType; maxSize: number }): string[] => {
  const pieces: string[] = [];
  let start = 0;
  while (start < text.length) {
    const size = 1 + random.int(maxSize);
    pieces.push(text.slice(start, start + size));
    start += size;
  }
  return pieces;
};

/**
 * Encode to UTF-8, cut the bytes at `offsets` and decode like a streaming response does. Cuts inside multi-byte
 * sequences are held back by the streaming `TextDecoder`, so the parser sees odd piece boundaries (and empty pieces).
 */
export const decodeByteChunks = (text: string, offsets: readonly number[]): string[] => {
  const bytes = new TextEncoder().encode(text);
  // `ignoreBOM` keeps a leading byte order mark in the output, so the parser's own BOM handling is exercised
  const decoder = new TextDecoder("utf-8", { ignoreBOM: true });
  const pieces: string[] = [];
  let start = 0;
  [...offsets, bytes.length].forEach((offset) => {
    pieces.push(decoder.decode(bytes.subarray(start, offset), { stream: true }));
    start = offset;
  });
  pieces.push(decoder.decode());
  return pieces;
};

export type SSEResultType = { events: ServerSentEventType[]; comments: string[] };

export const collectSSE = () => {
  const result: SSEResultType = { events: [], comments: [] };
  const parser = createSSEParser({
    onEvent: (event) => result.events.push(event),
    onComment: (comment) => result.comments.push(comment),
  });
  return { parser, ...result, result };
};

export const runSSE = (pieces: readonly string[], { flush = true }: { flush?: boolean } = {}): SSEResultType => {
  const { parser, result } = collectSSE();
  pieces.forEach((piece) => parser.feed(piece));
  if (flush) {
    parser.flush();
  }
  return result;
};

/**
 * Straightforward, non-incremental implementation of the WHATWG "event stream interpretation" algorithm
 * (https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation), working on the
 * whole text at once. It shares no code with the parser under test.
 *
 * It encodes the two documented deviations of the HyperFetch parser: comments are reported (with one leading space
 * removed), and with `flush` the unterminated last line and the pending event are processed instead of dropped.
 */
export const referenceSSE = (text: string, { flush = true }: { flush?: boolean } = {}): SSEResultType => {
  const events: ServerSentEventType[] = [];
  const comments: string[] = [];

  const stream = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const lines = stream.split(/\r\n|\n|\r/);
  const unterminated = lines.pop() as string;
  if (flush && unterminated !== "") {
    lines.push(unterminated);
  }

  let dataBuffer: string[] = [];
  let eventTypeBuffer = "";
  let lastEventIdBuffer = "";
  let retry: number | undefined;

  const dispatch = () => {
    if (dataBuffer.length > 0) {
      const event: ServerSentEventType = {
        event: eventTypeBuffer === "" ? "message" : eventTypeBuffer,
        data: dataBuffer.join("\n"),
        id: lastEventIdBuffer,
      };
      if (retry !== undefined) {
        event.retry = retry;
      }
      events.push(event);
    }
    dataBuffer = [];
    eventTypeBuffer = "";
    retry = undefined;
  };

  lines.forEach((line) => {
    if (line === "") {
      dispatch();
      return;
    }
    const [name, ...valueParts] = line.split(":");
    if (name === "" && valueParts.length > 0) {
      const comment = valueParts.join(":");
      comments.push(comment.startsWith(" ") ? comment.slice(1) : comment);
      return;
    }
    let value = valueParts.join(":");
    if (value.startsWith(" ")) {
      value = value.slice(1);
    }
    switch (name) {
      case "event": {
        eventTypeBuffer = value;
        break;
      }
      case "data": {
        dataBuffer.push(value);
        break;
      }
      case "id": {
        if (!value.includes("\0")) {
          lastEventIdBuffer = value;
        }
        break;
      }
      case "retry": {
        if (value !== "" && [...value].every((char) => char >= "0" && char <= "9")) {
          retry = Number.parseInt(value, 10);
        }
        break;
      }
      default: {
        break;
      }
    }
  });

  if (flush) {
    dispatch();
  }

  return { events, comments };
};

const SSE_LINES = [
  "data: hello",
  "data:no-space",
  "data:  two spaces",
  "data",
  "data:",
  "data: ",
  'data: {"json":true,"n":[1,2,3]}',
  "data: zażółć gęślą jaźń 🚀 日本語",
  "data: a:b:c",
  "data: \ttab",
  "data: 😀😀",
  "event: delta",
  "event:done",
  "event",
  "event:",
  "event: message",
  "id: 1",
  "id:abc",
  "id",
  "id: has\0null",
  "retry: 1500",
  "retry:0",
  "retry: 10s",
  "retry: -1",
  "retry",
  ": comment",
  ":",
  ":no space",
  ":  two spaces",
  "unknown: field",
  "Data: wrong case",
  " data: leading space",
  "data : space before colon",
  "datax: longer name",
  "dat",
  "\u2028data: not a line break",
];

const LINE_ENDINGS = ["\n", "\n", "\n", "\r\n", "\r\n", "\r"];

/** Random event stream text made of valid, odd and invalid lines with mixed line endings. */
export const randomSSEStream = (
  random: RandomType,
  { lines = 12, bom = true }: { lines?: number; bom?: boolean } = {},
): string => {
  let text = bom && random.chance(0.15) ? "\uFEFF" : "";
  const count = 1 + random.int(lines);
  for (let i = 0; i < count; i += 1) {
    // Blank lines dispatch - make them common enough to get several events per stream
    const line = random.chance(0.3) ? "" : random.pick(SSE_LINES);
    text += line + random.pick(LINE_ENDINGS);
  }
  if (random.chance(0.5)) {
    // Unterminated last line - only processed on flush
    text += random.pick(SSE_LINES);
  }
  return text;
};

export const collectNDJSON = (options: { withOnError?: boolean } = {}) => {
  const values: unknown[] = [];
  const errors: { message: string; line: string }[] = [];
  const parser: StreamParserType = createNDJSONParser({
    onValue: (value) => values.push(value),
    ...(options.withOnError ? { onError: (error, line) => errors.push({ message: error.message, line }) } : {}),
  });
  return { parser, values, errors };
};

export const runNDJSON = (pieces: readonly string[]) => {
  const { parser, values, errors } = collectNDJSON({ withOnError: true });
  pieces.forEach((piece) => parser.feed(piece));
  parser.flush();
  return { values, errors };
};

const JSON_STRINGS = [
  "",
  "a",
  "zażółć",
  "🚀",
  'q"uote',
  String.raw`back\slash`,
  "line\nbreak",
  "\u2028",
  "tab\t",
  "{[]}",
  "日本",
];

/** Random JSON value. Strings may contain escaped newlines - the serialized form never contains a raw line break. */
export const randomJSONValue = (random: RandomType, depth = 0): unknown => {
  const kind = random.int(depth > 2 ? 5 : 7);
  switch (kind) {
    case 0: {
      return random.pick(JSON_STRINGS);
    }
    case 1: {
      return random.pick([0, 1, -1, 1.5, -2.25e-7, 1e21, 123_456_789]);
    }
    case 2: {
      return random.chance(0.5);
    }
    case 3: {
      return null;
    }
    case 4: {
      return random.pick(JSON_STRINGS) + random.pick(JSON_STRINGS);
    }
    case 5: {
      return Array.from({ length: random.int(4) }, () => randomJSONValue(random, depth + 1));
    }
    default: {
      const entries = Array.from({ length: random.int(4) }, (_, index) => [
        `${random.pick(JSON_STRINGS)}${index}`,
        randomJSONValue(random, depth + 1),
      ]);
      return Object.fromEntries(entries);
    }
  }
};
