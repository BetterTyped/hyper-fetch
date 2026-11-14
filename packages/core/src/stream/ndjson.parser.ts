import type { NDJSONParserOptionsType, StreamParserType } from "./stream.types";

/**
 * Incremental newline-delimited JSON (NDJSON / JSON Lines) parser. Feed it decoded text in pieces of any size;
 * every complete non-empty line is parsed as JSON.
 */
export const createNDJSONParser = <T = unknown>({ onValue, onError }: NDJSONParserOptionsType<T>): StreamParserType => {
  let buffer = "";

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

  return {
    feed: (text: string) => {
      if (!text) {
        return;
      }
      buffer += text;
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        processLine(line);
        newlineIndex = buffer.indexOf("\n");
      }
    },
    flush: () => {
      const rest = buffer;
      buffer = "";
      processLine(rest);
    },
    reset: () => {
      buffer = "";
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
