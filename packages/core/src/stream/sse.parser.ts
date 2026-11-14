import type { SSEParserOptionsType, ServerSentEventType, StreamParserType } from "./stream.types";

const BOM = "﻿";

/**
 * Incremental Server-Sent Events parser following the WHATWG event stream format.
 *
 * Unlike `EventSource` it works on any text stream, so it can parse SSE sent in response to POST requests
 * (which is how LLM APIs and AI backends stream). Feed it decoded text in pieces of any size.
 *
 * Differences from the spec: an event still buffered when `flush()` is called is dispatched instead of
 * dropped, because many servers close the stream without the final blank line.
 */
export const createSSEParser = ({ onEvent, onComment }: SSEParserOptionsType): StreamParserType => {
  let buffer = "";
  let isFirstFeed = true;
  let skipLeadingLF = false;

  let data = "";
  let hasData = false;
  let eventType = "";
  let lastEventId = "";
  let retry: number | undefined;

  const dispatch = () => {
    if (hasData) {
      const event: ServerSentEventType = {
        event: eventType || "message",
        data: data.endsWith("\n") ? data.slice(0, -1) : data,
        id: lastEventId,
      };
      if (retry !== undefined) {
        event.retry = retry;
      }
      onEvent(event);
    }
    data = "";
    hasData = false;
    eventType = "";
    retry = undefined;
  };

  const processLine = (line: string) => {
    if (line === "") {
      dispatch();
      return;
    }

    if (line.startsWith(":")) {
      onComment?.(line.slice(1).replace(/^ /, ""));
      return;
    }

    const colonIndex = line.indexOf(":");
    const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
    let value = colonIndex === -1 ? "" : line.slice(colonIndex + 1);
    if (value.startsWith(" ")) {
      value = value.slice(1);
    }

    if (field === "event") {
      eventType = value;
    } else if (field === "data") {
      data += `${value}\n`;
      hasData = true;
    } else if (field === "id") {
      if (!value.includes("\0")) {
        lastEventId = value;
      }
    } else if (field === "retry" && /^\d+$/.test(value)) {
      retry = Number(value);
    }
  };

  const processBuffer = () => {
    let start = 0;
    const { length } = buffer;

    if (skipLeadingLF && buffer[0] === "\n") {
      start = 1;
    }
    skipLeadingLF = false;

    for (let i = start; i < length; i += 1) {
      const char = buffer[i];
      if (char === "\n" || char === "\r") {
        processLine(buffer.slice(start, i));
        if (char === "\r") {
          if (i + 1 === length) {
            // CR at the end of the piece - the matching LF may arrive with the next piece
            skipLeadingLF = true;
          } else if (buffer[i + 1] === "\n") {
            i += 1;
          }
        }
        start = i + 1;
      }
    }

    buffer = buffer.slice(start);
  };

  return {
    feed: (text: string) => {
      if (!text) {
        return;
      }
      let piece = text;
      if (isFirstFeed) {
        isFirstFeed = false;
        if (piece.startsWith(BOM)) {
          piece = piece.slice(BOM.length);
        }
      }
      buffer += piece;
      processBuffer();
    },
    flush: () => {
      if (buffer) {
        processLine(buffer);
        buffer = "";
      }
      skipLeadingLF = false;
      dispatch();
    },
    reset: () => {
      buffer = "";
      isFirstFeed = true;
      skipLeadingLF = false;
      data = "";
      hasData = false;
      eventType = "";
      lastEventId = "";
      retry = undefined;
    },
  };
};

/** Parse a complete SSE body at once. */
export const parseSSE = (text: string): ServerSentEventType[] => {
  const events: ServerSentEventType[] = [];
  const parser = createSSEParser({ onEvent: (event) => events.push(event) });
  parser.feed(text);
  parser.flush();
  return events;
};
