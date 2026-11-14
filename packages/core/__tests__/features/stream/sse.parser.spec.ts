import type { ServerSentEventType } from "../../../src";
import { createSSEParser, parseSSE } from "../../../src";

const collect = () => {
  const events: ServerSentEventType[] = [];
  const comments: string[] = [];
  const parser = createSSEParser({
    onEvent: (event) => events.push(event),
    onComment: (comment) => comments.push(comment),
  });
  return { parser, events, comments };
};

/** Feed text split at every possible position, the result must not depend on chunking */
const feedSplitEverywhere = (text: string) => {
  const results: ServerSentEventType[][] = [];
  for (let i = 0; i <= text.length; i += 1) {
    const { parser, events } = collect();
    parser.feed(text.slice(0, i));
    parser.feed(text.slice(i));
    parser.flush();
    results.push(events);
  }
  return results;
};

describe("SSE parser", () => {
  it("should parse a basic event", () => {
    expect(parseSSE("data: hello\n\n")).toEqual([{ event: "message", data: "hello", id: "" }]);
  });

  it("should join multi-line data with newlines", () => {
    expect(parseSSE("data: line 1\ndata: line 2\ndata:\n\n")).toEqual([
      { event: "message", data: "line 1\nline 2\n", id: "" },
    ]);
  });

  it("should handle the event, id and retry fields", () => {
    expect(parseSSE("event: delta\nid: 7\nretry: 1500\ndata: x\n\n")).toEqual([
      { event: "delta", data: "x", id: "7", retry: 1500 },
    ]);
  });

  it("should keep the last event id across events and reset the event type", () => {
    expect(parseSSE("event: a\nid: 1\ndata: x\n\ndata: y\n\n")).toEqual([
      { event: "a", data: "x", id: "1" },
      { event: "message", data: "y", id: "1" },
    ]);
  });

  it("should ignore ids containing NULL and non-numeric retry values", () => {
    expect(parseSSE("id: 1\ndata: a\n\nid: 2\0\nretry: 10s\ndata: b\n\n")).toEqual([
      { event: "message", data: "a", id: "1" },
      { event: "message", data: "b", id: "1" },
    ]);
  });

  it("should strip only a single leading space from values", () => {
    expect(parseSSE("data:  two spaces\n\ndata:none\n\n").map(({ data }) => data)).toEqual([" two spaces", "none"]);
  });

  it("should treat a line without a colon as a field with an empty value", () => {
    expect(parseSSE("data\n\n")).toEqual([{ event: "message", data: "", id: "" }]);
  });

  it("should report comments and ignore unknown fields", () => {
    const { parser, events, comments } = collect();
    parser.feed(": ping\n:no space\nfoo: bar\ndata: ok\n\n");
    expect(comments).toEqual(["ping", "no space"]);
    expect(events).toEqual([{ event: "message", data: "ok", id: "" }]);
  });

  it("should not dispatch blocks without data", () => {
    expect(parseSSE("event: empty\n\nid: 3\n\n")).toEqual([]);
  });

  it("should support CRLF, CR and LF line endings", () => {
    const expected = [
      { event: "message", data: "a", id: "" },
      { event: "message", data: "b", id: "" },
      { event: "message", data: "c", id: "" },
    ];
    expect(parseSSE("data: a\r\n\r\ndata: b\r\rdata: c\n\n")).toEqual(expected);
  });

  it("should handle CRLF split between two pieces without creating an empty line", () => {
    const { parser, events } = collect();
    parser.feed("data: a\r");
    parser.feed("\ndata: b\r\n\r\n");
    expect(events).toEqual([{ event: "message", data: "a\nb", id: "" }]);
  });

  it("should strip a leading byte order mark only at the start of the stream", () => {
    const { parser, events } = collect();
    parser.feed("﻿data: a\n\n");
    parser.feed("﻿data: b\n\n");
    // A BOM later in the stream is part of the field name ("\uFEFFdata"), which is unknown and ignored
    expect(events.map(({ data }) => data)).toEqual(["a"]);
  });

  it("should produce the same events no matter where the stream is split", () => {
    const text = 'event: delta\r\nid: 1\r\ndata: {"a":1}\r\n\r\n: comment\ndata: x\ndata: y\r\rdata: zażółć 🚀\n\n';
    const [first, ...rest] = feedSplitEverywhere(text);
    expect(first).toHaveLength(3);
    rest.forEach((events) => expect(events).toEqual(first));
  });

  it("should dispatch a trailing event without a blank line on flush", () => {
    const { parser, events } = collect();
    parser.feed("data: last");
    expect(events).toEqual([]);
    parser.flush();
    expect(events).toEqual([{ event: "message", data: "last", id: "" }]);
  });

  it("should forget buffered state on reset", () => {
    const { parser, events } = collect();
    parser.feed("id: 9\ndata: partial");
    parser.reset();
    parser.feed("data: fresh\n\n");
    expect(events).toEqual([{ event: "message", data: "fresh", id: "" }]);
  });

  it("should ignore empty pieces", () => {
    const { parser, events } = collect();
    parser.feed("");
    parser.feed("data: a\n\n");
    parser.feed("");
    expect(events).toHaveLength(1);
  });
});
