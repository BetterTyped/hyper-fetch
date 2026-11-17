import type { NDJSONParserOptionsType, StreamParserType } from "./stream.types";

/**
 * Incremental newline-delimited JSON (NDJSON / JSON Lines) parser. Feed it decoded text in pieces of any size;
 * every complete non-empty line is parsed as JSON.
 */
export const createNDJSONParser = <T = unknown>({ onValue, onError }: NDJSONParserOptionsType<T>): StreamParserType => {
  /** Text that is not parsed yet - normally just the unterminated last line */
  let buffer = "";
  /** The buffer may hold complete lines - only after a line or a callback threw in the middle of a piece */
  let hasBufferedLines = false;

  const processLine = (rawLine: string) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    let value: T;
    try {
      value = JSON.parse(line) as T;
    } catch (error) {
      const parseError = new Error(`Invalid NDJSON line: ${line.length > 200 ? `${line.slice(0, 200)}...` : line}`, {
        cause: error,
      });
      if (onError) {
        onError(parseError, line);
        return;
      }
      throw parseError;
    }
    onValue(value);
  };

  /** Parse every complete line of the buffer and keep the unterminated rest. */
  const processBuffer = () => {
    let start = 0;
    let completed = false;
    try {
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(start, newlineIndex);
        // Move past the line before parsing it - an invalid line that throws must not be parsed again
        start = newlineIndex + 1;
        processLine(line);
        newlineIndex = buffer.indexOf("\n", start);
      }
      completed = true;
    } finally {
      buffer = buffer.slice(start);
      hasBufferedLines = !completed;
    }
  };

  return {
    feed: (text: string) => {
      if (!text) {
        return;
      }
      buffer += text;
      // Without a line ending in the new piece there is nothing to parse. Searching the growing buffer again on
      // every piece would make a long line arriving in small pieces quadratic.
      if (hasBufferedLines || text.includes("\n")) {
        processBuffer();
      }
    },
    flush: () => {
      if (hasBufferedLines) {
        processBuffer();
      }
      const rest = buffer;
      buffer = "";
      processLine(rest);
    },
    reset: () => {
      buffer = "";
      hasBufferedLines = false;
    },
  };
};

/** Parse a complete NDJSON body at once. */
export const parseNDJSON = <T = unknown>(text: string): T[] => {
  const values: T[] = [];
  const parser = createNDJSONParser<T>({ onValue: (value) => values.push(value) });
  parser.feed(text);
  parser.flush();
  return values;
};
