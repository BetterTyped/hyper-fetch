import type { OrpcIteratorEventType } from "../socket/socket.types";

/** One message of a `text/event-stream`, the fields of the Server-Sent Events format */
export type OrpcEventStreamMessageType = {
  event: string | undefined;
  data: string | undefined;
  id: string | undefined;
  retry: number | undefined;
};

const lineEnding = /\r\n|\r(?!\n)|\n/;
const messageDelimiter = /(?:\r\n|\r(?!\n)|\n){2}/g;

/** Reads the fields of one message, the same as `decodeEventMessage` of oRPC */
const decodeEventStreamMessage = (encoded: string): OrpcEventStreamMessageType => {
  const message: OrpcEventStreamMessageType = { event: undefined, data: undefined, id: undefined, retry: undefined };

  encoded.split(lineEnding).forEach((line) => {
    const index = line.indexOf(":");
    // Lines starting with a colon are comments, the keep-alive pings of oRPC
    if (line === "" || index === 0) {
      return;
    }
    const field = index === -1 ? line : line.slice(0, index);
    const value = index === -1 ? "" : line.slice(line.charAt(index + 1) === " " ? index + 2 : index + 1);

    if (field === "data") {
      message.data = message.data === undefined ? value : `${message.data}\n${value}`;
    } else if (field === "event") {
      message.event = value;
    } else if (field === "id") {
      message.id = value;
    } else if (field === "retry") {
      const retry = Number.parseInt(value, 10);
      if (retry >= 0 && retry.toString() === value) {
        message.retry = retry;
      }
    }
  });

  return message;
};

/**
 * Splits the text of a `text/event-stream` into messages, the same as the `EventDecoder` of oRPC. Chunks can end
 * anywhere, the text after the last complete message waits for the next chunk.
 */
export const createEventStreamDecoder = (onMessage: (message: OrpcEventStreamMessageType) => void) => {
  let pending = "";
  // A chunk that ended a message with `\r` may be followed by the `\n` of the same `\r\n`
  let discardLeadingLineFeed = false;

  const feed = (chunk: string) => {
    pending += discardLeadingLineFeed && chunk.startsWith("\n") ? chunk.slice(1) : chunk;
    discardLeadingLineFeed = false;

    let start = 0;
    const messages: string[] = [];
    [...pending.matchAll(messageDelimiter)].forEach((match) => {
      // `matchAll` always sets the index - older TypeScript versions type it as optional
      const { index = 0 } = match;
      messages.push(pending.slice(start, index));
      start = index + match[0].length;
    });
    if (messages.length > 0) {
      discardLeadingLineFeed = start === pending.length && pending.endsWith("\r");
    }
    pending = pending.slice(start);

    messages.forEach((message) => onMessage(decodeEventStreamMessage(message)));
  };

  /** The same as oRPC - a stream that stops in the middle of a message is broken */
  const end = () => {
    if (pending !== "") {
      throw new Error("The event stream ended before the last message was complete");
    }
  };

  return { feed, end };
};

/**
 * Maps a message to the event of the server iterator, the same as `toEventIterator` of oRPC. Messages without an
 * event and data are keep-alive pings and return `null`. Throws when the data is not JSON.
 */
export const getEventStreamIteratorEvent = (message: OrpcEventStreamMessageType): OrpcIteratorEventType | null => {
  const event = message.event ?? (message.data !== undefined ? "message" : undefined);
  const meta = { id: message.id, retry: message.retry };

  if (event === "message" || event === "error") {
    return { event, data: message.data ? JSON.parse(message.data) : undefined, meta };
  }
  if (event === "done" || event === "close") {
    return { event: "done", data: undefined, meta };
  }
  return null;
};
