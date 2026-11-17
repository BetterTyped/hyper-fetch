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
  /** Text that is not processed yet - normally just the unterminated last line */
  let buffer = "";
  /** The buffer may hold complete lines - only after a callback threw in the middle of a piece */
  let hasBufferedLines = false;
  let isFirstFeed = true;
  let skipLeadingLF = false;

  let data = "";
  let hasData = false;
  let eventType = "";
  let lastEventId = "";
  let retry: number | undefined;

  const dispatch = () => {
    let event: ServerSentEventType | undefined;
    if (hasData) {
      event = {
        event: eventType || "message",
        data: data.endsWith("\n") ? data.slice(0, -1) : data,
        id: lastEventId,
      };
      if (retry !== undefined) {
        event.retry = retry;
      }
    }
    // Reset before calling out, so a throwing `onEvent` cannot leave the event behind to be dispatched again
    data = "";
    hasData = false;
    eventType = "";
    retry = undefined;
    if (event) {
      onEvent(event);
    }
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

  /**
   * Process every complete line of the buffer and keep the unterminated rest. `scanFrom` is the first position that
   * may hold a line ending - everything before it was already searched when it was buffered.
   */
  const processBuffer = (scanFrom: number) => {
    let start = 0;
    const { length } = buffer;

    if (skipLeadingLF && buffer[0] === "\n") {
      start = 1;
    }
    skipLeadingLF = false;

    let completed = false;
    try {
      for (let i = Math.max(start, scanFrom); i < length; i += 1) {
        const char = buffer[i];
        if (char !== "\n" && char !== "\r") {
          continue;
        }
        const line = buffer.slice(start, i);
        if (char === "\r" && i + 1 === length) {
          // CR at the end of the piece - the matching LF may arrive with the next piece
          skipLeadingLF = true;
        } else if (char === "\r" && buffer[i + 1] === "\n") {
          i += 1;
        }
        // Move past the line before processing it - a throwing callback must not see it again
        start = i + 1;
        processLine(line);
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
      let piece = text;
      if (isFirstFeed) {
        isFirstFeed = false;
        if (piece.startsWith(BOM)) {
          piece = piece.slice(BOM.length);
        }
      }
      if (!hasBufferedLines && !piece.includes("\n") && !piece.includes("\r")) {
        // No line ends here. Only append - searching the growing buffer again on every piece would make a long
        // line arriving in small pieces quadratic.
        if (piece) {
          skipLeadingLF = false;
          buffer += piece;
        }
        return;
      }
      const scanFrom = hasBufferedLines ? 0 : buffer.length;
      buffer += piece;
      processBuffer(scanFrom);
    },
    flush: () => {
      if (hasBufferedLines) {
        processBuffer(0);
      }
      const rest = buffer;
      buffer = "";
      skipLeadingLF = false;
      if (rest) {
        processLine(rest);
      }
      dispatch();
    },
    reset: () => {
      buffer = "";
      hasBufferedLines = false;
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
