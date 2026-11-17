import type { ServerSentEventType } from "../../../src";
import { createSSEParser, parseSSE } from "../../../src";
import { collectSSE } from "./stream.fuzz.utils";

const BOM = "\uFEFF";
const message = (data: string, rest: Partial<ServerSentEventType> = {}): ServerSentEventType => ({
  event: "message",
  data,
  id: "",
  ...rest,
});

describe("SSE parser - WHATWG event stream edge cases", () => {
  describe("byte order mark", () => {
    it("should strip a BOM that arrives as its own first piece", () => {
      const { parser, events } = collectSSE();
      parser.feed(BOM);
      parser.feed("data: a\n\n");
      expect(events).toEqual([message("a")]);
    });

    it("should strip a BOM from the first non-empty piece when empty pieces come first", () => {
      const { parser, events } = collectSSE();
      parser.feed("");
      parser.feed("");
      parser.feed(`${BOM}data: a\n\n`);
      expect(events).toEqual([message("a")]);
    });

    it("should strip only one BOM", () => {
      // The second BOM becomes a part of the field name, and "\uFEFFdata" is not a known field
      expect(parseSSE(`${BOM}${BOM}data: a\n\ndata: b\n\n`)).toEqual([message("b")]);
    });

    it("should not strip a BOM in the middle of the stream", () => {
      expect(parseSSE(`data: a\n\n${BOM}data: b\n\ndata: c\n\n`)).toEqual([message("a"), message("c")]);
    });

    it("should keep a BOM inside a value", () => {
      expect(parseSSE(`data: ${BOM}x${BOM}\n\n`)).toEqual([message(`${BOM}x${BOM}`)]);
    });

    it("should strip a BOM again after reset", () => {
      const { parser, events } = collectSSE();
      parser.feed(`${BOM}data: a\n\n`);
      parser.reset();
      parser.feed(`${BOM}data: b\n\n`);
      expect(events).toEqual([message("a"), message("b")]);
    });

    it("should not treat a BOM after flush as the start of the stream", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\n\n");
      parser.flush();
      parser.feed(`${BOM}data: b\n\ndata: c\n\n`);
      expect(events).toEqual([message("a"), message("c")]);
    });

    it("should dispatch nothing for a stream that is only a BOM", () => {
      expect(parseSSE(BOM)).toEqual([]);
    });
  });

  describe("line endings", () => {
    it.each([
      ["LF", "\n"],
      ["CR", "\r"],
      ["CRLF", "\r\n"],
    ])("should parse a stream using only %s", (_name, eol) => {
      const text = ["event: a", "id: 1", "data: x", "data: y", "", ": note", "data: z", "", ""].join(eol);
      const { parser, events, comments } = collectSSE();
      parser.feed(text);
      expect(events).toEqual([message("x\ny", { event: "a", id: "1" }), message("z", { id: "1" })]);
      expect(comments).toEqual(["note"]);
    });

    it("should treat LF followed by CR as two line endings", () => {
      expect(parseSSE("data: a\n\rdata: b\n\r")).toEqual([message("a"), message("b")]);
    });

    it("should treat CR CR LF as two line endings", () => {
      expect(parseSSE("data: a\r\r\ndata: b\r\r\n")).toEqual([message("a"), message("b")]);
    });

    it("should treat CR LF LF as two line endings", () => {
      expect(parseSSE("data: a\r\n\ndata: b\r\n\n")).toEqual([message("a"), message("b")]);
    });

    it("should treat CR LF CR LF as two line endings and not four", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\r\n\r\ndata: b\r\n\r\n");
      expect(events).toEqual([message("a"), message("b")]);
    });

    it("should mix all three line endings inside a single event", () => {
      expect(parseSSE("event: mix\rid: 9\r\ndata: 1\ndata: 2\rdata: 3\r\n\r")).toEqual([
        message("1\n2\n3", { event: "mix", id: "9" }),
      ]);
    });

    it("should not treat other unicode line separators as line endings", () => {
      const data = "a\u2028b\u2029c\u000Bd\u000Ce\u0085f";
      expect(parseSSE(`data: ${data}\n\n`)).toEqual([message(data)]);
    });

    it("should dispatch a line ended with CR before the next piece arrives", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\r\r");
      expect(events).toEqual([message("a")]);
    });

    it("should not swallow a LF that does not directly follow a CR from the previous piece", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\r");
      parser.feed("data: b\n");
      parser.feed("\n");
      expect(events).toEqual([message("a\nb")]);
    });

    it("should swallow exactly one LF after a CR that ended the previous piece", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\r");
      parser.feed("\n\n");
      expect(events).toEqual([message("a")]);
      parser.feed("data: b\r");
      parser.feed("\n");
      parser.feed("\n");
      expect(events).toEqual([message("a"), message("b")]);
    });

    it("should keep waiting for the LF of a split CRLF across empty pieces", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\r");
      parser.feed("");
      parser.feed("\ndata: b\r");
      parser.feed("");
      parser.feed("\n\r");
      parser.feed("\n");
      expect(events).toEqual([message("a\nb")]);
    });

    it("should treat CR followed by CR in the next piece as two line endings", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\r");
      parser.feed("\rdata: b\r");
      parser.feed("\r");
      expect(events).toEqual([message("a"), message("b")]);
    });

    it("should handle a stream of single character pieces of CRLF pairs", () => {
      const { parser, events } = collectSSE();
      [..."data: a\r\n\r\ndata: b\r\n\r\n"].forEach((char) => parser.feed(char));
      expect(events).toEqual([message("a"), message("b")]);
    });

    it("should not dispatch for runs of blank lines", () => {
      expect(parseSSE("\n\n\r\n\r\r\n\ndata: a\n\n\n\n\r\n\r\n")).toEqual([message("a")]);
    });
  });

  describe("comments", () => {
    const comments = (text: string) => {
      const collected = collectSSE();
      collected.parser.feed(text);
      collected.parser.flush();
      return collected.comments;
    };

    it.each([
      [":", ""],
      [": ", ""],
      [":  ", " "],
      [":x", "x"],
      [": x", "x"],
      [":  x", " x"],
      [": a: b: c", "a: b: c"],
      ["::", ":"],
      [":\tx", "\tx"],
      [": data: not a field", "data: not a field"],
    ])("should report the comment line %j as %j", (line, expected) => {
      expect(comments(`${line}\n`)).toEqual([expected]);
    });

    it("should report a comment that is not terminated on flush", () => {
      expect(comments(": tail")).toEqual(["tail"]);
    });

    it("should not treat comments as blank lines", () => {
      const { parser, events, comments: collected } = collectSSE();
      parser.feed("data: a\n: keep-alive\ndata: b\n:\n\n");
      expect(events).toEqual([message("a\nb")]);
      expect(collected).toEqual(["keep-alive", ""]);
    });

    it("should ignore comments when no onComment callback is given", () => {
      const events: ServerSentEventType[] = [];
      const parser = createSSEParser({ onEvent: (event) => events.push(event) });
      parser.feed(": ping\ndata: a\n\n: pong\n");
      parser.flush();
      expect(events).toEqual([message("a")]);
    });

    it("should report comments in order with events", () => {
      const order: string[] = [];
      const parser = createSSEParser({
        onEvent: (event) => order.push(`event:${event.data}`),
        onComment: (comment) => order.push(`comment:${comment}`),
      });
      parser.feed(": one\ndata: a\n\n: two\ndata: b\n\n: three\n");
      expect(order).toEqual(["comment:one", "event:a", "comment:two", "event:b", "comment:three"]);
    });
  });

  describe("data field", () => {
    it.each([
      ["data\n\n", ""],
      ["data:\n\n", ""],
      ["data: \n\n", ""],
      ["data:  \n\n", " "],
      ["data:x\n\n", "x"],
      ["data: x\n\n", "x"],
      ["data:  x\n\n", " x"],
      ["data:\tx\n\n", "\tx"],
      ["data: x \n\n", "x "],
      ["data: a:b\n\n", "a:b"],
      ["data::\n\n", ":"],
      ["data: :\n\n", ":"],
      ["data:data: x\n\n", "data: x"],
      ["data: \0\n\n", "\0"],
    ])("should read %j as data %j", (text, expected) => {
      expect(parseSSE(text)).toEqual([message(expected)]);
    });

    it("should join data lines with LF regardless of the stream line ending", () => {
      expect(parseSSE("data: a\r\ndata: b\rdata: c\n\n")).toEqual([message("a\nb\nc")]);
    });

    it("should keep empty data lines as empty lines of the payload", () => {
      expect(parseSSE("data\ndata\n\n")).toEqual([message("\n")]);
      expect(parseSSE("data:\ndata: x\ndata:\n\n")).toEqual([message("\nx\n")]);
      expect(parseSSE("data: x\ndata\ndata\n\n")).toEqual([message("x\n\n")]);
    });

    it("should remove only the single trailing LF added by the last data line", () => {
      // The value itself can never contain a line break, so the payload ends with as many LFs as trailing empty lines
      expect(parseSSE("data: x\ndata:\ndata:\ndata:\n\n")).toEqual([message("x\n\n\n")]);
    });

    it("should dispatch an event whose only data line is empty", () => {
      expect(parseSSE("event: ping\ndata\n\n")).toEqual([message("", { event: "ping" })]);
    });

    it("should keep data across unknown fields and comments", () => {
      expect(parseSSE("data: a\nfoo: bar\n: c\nfoo\ndata: b\n\n")).toEqual([message("a\nb")]);
    });

    it("should preserve unicode, surrogate pairs and lone surrogates", () => {
      const data = "zażółć 🚀 \uD83D \uDE00 日本語 \u0000 \u007F";
      expect(parseSSE(`data: ${data}\n\n`)).toEqual([message(data)]);
    });

    it("should handle a 1MB data line", () => {
      const data = "x".repeat(1_000_000);
      expect(parseSSE(`data: ${data}\n\n`)).toEqual([message(data)]);
    });
  });

  describe("field names", () => {
    it.each([
      "Data: x",
      "DATA: x",
      " data: x",
      "data : x",
      "\tdata: x",
      "datax: x",
      "dat: x",
      "d: x",
      "data\0: x",
      "message: x",
      "Event: x",
      "ID: x",
      "Retry: 5",
    ])("should ignore the unknown field line %j", (line) => {
      expect(parseSSE(`${line}\n\n`)).toEqual([]);
      expect(parseSSE(`${line}\ndata: ok\n\n`)).toEqual([message("ok")]);
    });

    it("should use the whole line as the field name when there is no colon", () => {
      expect(parseSSE("event\ndata\nid\nretry\n\n")).toEqual([message("")]);
    });

    it("should only split on the first colon", () => {
      expect(parseSSE("event: a:b\nid: c:d\ndata: e:f\n\n")).toEqual([message("e:f", { event: "a:b", id: "c:d" })]);
    });
  });

  describe("event field", () => {
    it("should default to message and reset the type after every dispatch", () => {
      expect(parseSSE("event: a\ndata: 1\n\ndata: 2\n\nevent: b\ndata: 3\n\n")).toEqual([
        message("1", { event: "a" }),
        message("2"),
        message("3", { event: "b" }),
      ]);
    });

    it("should use the last event field of a block", () => {
      expect(parseSSE("event: a\nevent: b\ndata: x\n\n")).toEqual([message("x", { event: "b" })]);
    });

    it.each(["event\n", "event:\n", "event: \n"])("should fall back to message for an empty type (%j)", (line) => {
      expect(parseSSE(`event: custom\n${line}data: x\n\n`)).toEqual([message("x")]);
    });

    it("should keep spaces and case of the type", () => {
      expect(parseSSE("event:  Spaced Type \ndata: x\n\n")).toEqual([message("x", { event: " Spaced Type " })]);
    });

    it("should not leak the type of a block without data into the next event", () => {
      expect(parseSSE("event: orphan\n\ndata: x\n\n")).toEqual([message("x")]);
    });

    it("should accept the event field after the data field", () => {
      expect(parseSSE("data: x\nevent: late\n\n")).toEqual([message("x", { event: "late" })]);
    });
  });

  describe("id field", () => {
    it("should persist the last event id until it changes", () => {
      expect(parseSSE("id: 1\ndata: a\n\ndata: b\n\nid: 2\ndata: c\n\ndata: d\n\n").map(({ id }) => id)).toEqual([
        "1",
        "1",
        "2",
        "2",
      ]);
    });

    it.each(["id\n", "id:\n", "id: \n"])("should reset the last event id with an empty id (%j)", (line) => {
      expect(parseSSE(`id: 1\ndata: a\n\n${line}data: b\n\n`).map(({ id }) => id)).toEqual(["1", ""]);
    });

    it("should ignore an id containing NULL anywhere", () => {
      expect(parseSSE("id: 1\ndata: a\n\nid: \0\ndata: b\n\nid: x\0\ndata: c\n\nid: \0y\ndata: d\n\n")).toEqual([
        message("a", { id: "1" }),
        message("b", { id: "1" }),
        message("c", { id: "1" }),
        message("d", { id: "1" }),
      ]);
    });

    it("should remember an id sent in a block without data", () => {
      expect(parseSSE("id: 7\n\ndata: a\n\n")).toEqual([message("a", { id: "7" })]);
    });

    it("should apply an id sent after the data line to the same event", () => {
      expect(parseSSE("data: a\nid: 5\n\n")).toEqual([message("a", { id: "5" })]);
    });

    it("should use the last id of a block", () => {
      expect(parseSSE("id: 1\nid: 2\ndata: a\n\n")).toEqual([message("a", { id: "2" })]);
    });

    it("should keep the id unchanged by other characters", () => {
      expect(parseSSE("id:  spaced : id 🚀\ndata: a\n\n")).toEqual([message("a", { id: " spaced : id 🚀" })]);
    });
  });

  describe("retry field", () => {
    it.each([
      ["0", 0],
      ["1", 1],
      ["1500", 1500],
      ["007", 7],
      ["4294967296", 4_294_967_296],
    ])("should report retry %j as %j", (value, expected) => {
      expect(parseSSE(`retry: ${value}\ndata: x\n\n`)).toEqual([message("x", { retry: expected })]);
      expect(parseSSE(`retry:${value}\ndata: x\n\n`)).toEqual([message("x", { retry: expected })]);
    });

    it.each(["", " ", "1.5", "-1", "+1", "1e3", "10s", "0x10", " 5", "5 ", "1 000", "１２", "٣", "NaN", "Infinity"])(
      "should ignore the non ASCII-digit retry value %j",
      (value) => {
        expect(parseSSE(`retry: ${value}\ndata: x\n\n`)).toEqual([message("x")]);
      },
    );

    it("should ignore retry without a colon", () => {
      expect(parseSSE("retry\ndata: x\n\n")).toEqual([message("x")]);
    });

    it("should use the last valid retry of a block and not carry it to the next event", () => {
      expect(parseSSE("retry: 1\nretry: 2\nretry: nope\ndata: a\n\ndata: b\n\n")).toEqual([
        message("a", { retry: 2 }),
        message("b"),
      ]);
    });

    it("should not add a retry key when it was not sent", () => {
      expect(Object.keys(parseSSE("data: a\n\n")[0])).toEqual(["event", "data", "id"]);
    });
  });

  describe("dispatching", () => {
    it("should not dispatch blocks without a data field", () => {
      expect(parseSSE("event: a\nid: 1\nretry: 5\n: c\nfoo: bar\n\n")).toEqual([]);
    });

    it("should dispatch every event as soon as its blank line arrives", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\n");
      expect(events).toHaveLength(0);
      parser.feed("\n");
      expect(events).toHaveLength(1);
      parser.feed("data: b\n\ndata: c\n\ndata: d");
      expect(events).toHaveLength(3);
    });

    it("should hand out a new object for every event", () => {
      const events = parseSSE("data: a\n\ndata: a\n\n");
      expect(events[0]).toEqual(events[1]);
      expect(events[0]).not.toBe(events[1]);
    });

    it("should not be affected by a consumer mutating a dispatched event", () => {
      const seen: string[] = [];
      const parser = createSSEParser({
        onEvent: (event) => {
          seen.push(`${event.event}|${event.data}|${event.id}`);
          Object.assign(event, { event: "hacked", data: "hacked", id: "hacked" });
        },
      });
      parser.feed("id: 1\ndata: a\n\ndata: b\n\n");
      expect(seen).toEqual(["message|a|1", "message|b|1"]);
    });

    it("should parse 50 000 events fed at once", () => {
      const count = 50_000;
      let text = "";
      for (let i = 0; i < count; i += 1) {
        text += `id: ${i}\ndata: {"i":${i}}\n\n`;
      }
      const events = parseSSE(text);
      expect(events).toHaveLength(count);
      expect(events[count - 1]).toEqual(message(`{"i":${count - 1}}`, { id: String(count - 1) }));
    });

    it("should parse an event with 50 000 data lines", () => {
      const lines = 50_000;
      const [event] = parseSSE(`${"data: x\n".repeat(lines)}\n`);
      expect(event.data).toHaveLength(lines * 2 - 1);
      expect(event.data.startsWith("x\nx\n")).toBe(true);
    });
  });

  describe("flush", () => {
    it("should dispatch nothing for an empty stream", () => {
      const { parser, events, comments } = collectSSE();
      parser.flush();
      expect(events).toEqual([]);
      expect(comments).toEqual([]);
      expect(parseSSE("")).toEqual([]);
    });

    it("should dispatch the pending event when the stream ends after a complete line", () => {
      expect(parseSSE("event: e\nid: 1\ndata: last\n")).toEqual([message("last", { event: "e", id: "1" })]);
    });

    it("should process the unterminated last line before dispatching", () => {
      expect(parseSSE("data: a\ndata: b")).toEqual([message("a\nb")]);
      expect(parseSSE("data: a\nevent: tail")).toEqual([message("a", { event: "tail" })]);
      expect(parseSSE("data: a\nid: 3")).toEqual([message("a", { id: "3" })]);
      expect(parseSSE("data: a\nretry: 30")).toEqual([message("a", { retry: 30 })]);
      expect(parseSSE("data")).toEqual([message("")]);
    });

    it("should not dispatch on flush when the pending block has no data", () => {
      expect(parseSSE("event: only")).toEqual([]);
      expect(parseSSE("id: 1\n")).toEqual([]);
      expect(parseSSE("dat")).toEqual([]);
    });

    it("should not dispatch twice when flushed twice", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a");
      parser.flush();
      parser.flush();
      expect(events).toEqual([message("a")]);
    });

    it("should not dispatch again on flush after the blank line was already seen", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\n\n");
      parser.flush();
      expect(events).toEqual([message("a")]);
    });

    it("should forget a pending CR on flush", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\r");
      parser.flush();
      // The LF belongs to a new stream segment now, it must count as a line ending of its own
      parser.feed("\ndata: b\n\n");
      expect(events).toEqual([message("a"), message("b")]);
    });

    it("should keep the last event id but not the event type after flush", () => {
      const { parser, events } = collectSSE();
      parser.feed("event: e\nid: 4\ndata: a");
      parser.flush();
      parser.feed("data: b\n\n");
      expect(events).toEqual([message("a", { event: "e", id: "4" }), message("b", { id: "4" })]);
    });

    it("should dispatch a truncated event exactly as it was received", () => {
      expect(parseSSE('data: {"cut":')).toEqual([message('{"cut":')]);
    });
  });

  describe("reset", () => {
    it("should drop the buffered partial line", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: par");
      parser.reset();
      parser.feed("tial\n\ndata: ok\n\n");
      expect(events).toEqual([message("ok")]);
    });

    it("should drop the pending data, type, id and retry", () => {
      const { parser, events } = collectSSE();
      parser.feed("event: e\nid: 1\nretry: 9\ndata: a\n");
      parser.reset();
      parser.feed("data: b\n\n");
      parser.flush();
      expect(events).toEqual([message("b")]);
    });

    it("should drop the last event id of already dispatched events", () => {
      const { parser, events } = collectSSE();
      parser.feed("id: 1\ndata: a\n\n");
      parser.reset();
      parser.feed("data: b\n\n");
      expect(events).toEqual([message("a", { id: "1" }), message("b")]);
    });

    it("should forget a pending CR", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\r");
      parser.reset();
      parser.feed("\ndata: b\n\n");
      expect(events).toEqual([message("b")]);
    });

    it("should dispatch nothing on flush right after reset", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: a\ndata: b");
      parser.reset();
      parser.flush();
      expect(events).toEqual([]);
    });

    it("should be reusable for many streams", () => {
      const { parser, events } = collectSSE();
      for (let i = 0; i < 20; i += 1) {
        parser.feed(`${BOM}id: ${i}\ndata: ${i}\n\ndata: dropped`);
        parser.reset();
      }
      expect(events).toEqual(Array.from({ length: 20 }, (_, i) => message(String(i), { id: String(i) })));
    });
  });

  describe("independent parsers", () => {
    it("should not share any state between parser instances", () => {
      const first = collectSSE();
      const second = collectSSE();
      first.parser.feed("id: 1\nevent: a\ndata: fir");
      second.parser.feed("data: second\r");
      first.parser.feed("st\n\n");
      second.parser.feed("\n\n");
      expect(first.events).toEqual([message("first", { event: "a", id: "1" })]);
      expect(second.events).toEqual([message("second")]);
    });
  });

  describe("failing callbacks", () => {
    it("should not dispatch earlier events again after onEvent throws", () => {
      const seen: string[] = [];
      let shouldThrow = true;
      const parser = createSSEParser({
        onEvent: ({ data }) => {
          if (data === "bad" && shouldThrow) {
            shouldThrow = false;
            throw new Error("boom");
          }
          seen.push(data);
        },
      });

      expect(() => parser.feed("data: 1\n\ndata: bad\n\ndata: 3\n\n")).toThrow("boom");
      expect(seen).toEqual(["1"]);

      // The failing event is consumed, the rest of the piece is still delivered - nothing is dispatched twice
      parser.feed("data: 4\n\n");
      expect(seen).toEqual(["1", "3", "4"]);
    });

    it("should deliver the lines left behind by a throwing onEvent on flush", () => {
      const seen: string[] = [];
      const parser = createSSEParser({
        onEvent: ({ data }) => {
          if (data === "bad") {
            throw new Error("boom");
          }
          seen.push(data);
        },
      });

      expect(() => parser.feed("data: 1\n\ndata: bad\n\ndata: 3\n\ndata: 4")).toThrow("boom");
      parser.flush();
      expect(seen).toEqual(["1", "3", "4"]);
    });

    it("should not keep the data of an event whose onEvent threw", () => {
      const seen: string[] = [];
      let calls = 0;
      const parser = createSSEParser({
        onEvent: ({ data }) => {
          calls += 1;
          if (calls === 1) {
            throw new Error("boom");
          }
          seen.push(data);
        },
      });

      expect(() => parser.feed("event: x\ndata: first\n\n")).toThrow("boom");
      parser.feed("data: second\n\n");
      parser.flush();
      expect(seen).toEqual(["second"]);
    });

    it("should keep a CRLF pair together when onEvent throws on the CR", () => {
      const seen: string[] = [];
      let shouldThrow = true;
      const parser = createSSEParser({
        onEvent: ({ data }) => {
          if (shouldThrow) {
            shouldThrow = false;
            throw new Error("boom");
          }
          seen.push(data);
        },
      });

      expect(() => parser.feed("data: a\r\n\r")).toThrow("boom");
      // This LF completes the CRLF of the blank line that dispatched - it is not another blank line
      parser.feed("\ndata: b\r\n\r\n");
      expect(seen).toEqual(["b"]);
    });

    it("should continue after onComment throws", () => {
      const comments: string[] = [];
      const events: string[] = [];
      const parser = createSSEParser({
        onEvent: ({ data }) => events.push(data),
        onComment: (comment) => {
          if (comment === "bad") {
            throw new Error("comment boom");
          }
          comments.push(comment);
        },
      });

      expect(() => parser.feed(": ok\n: bad\n: after\ndata: a\n\n")).toThrow("comment boom");
      parser.feed(": later\n");
      expect(comments).toEqual(["ok", "after", "later"]);
      expect(events).toEqual(["a"]);
    });
  });

  describe("performance", () => {
    // Each of these takes milliseconds when the parser is linear and far longer than the test timeout when every
    // piece makes it look at everything buffered so far again - a regression shows up as a timeout
    it("should stay linear for one long line arriving in single character pieces", () => {
      const data = "x".repeat(100_000);
      const { parser, events } = collectSSE();
      parser.feed("data: ");
      for (const char of data) {
        parser.feed(char);
      }
      parser.feed("\n\n");
      expect(events).toHaveLength(1);
      expect(events[0].data).toHaveLength(data.length);
    });

    it("should stay linear for one long line arriving in small pieces", () => {
      const data = "0123456789abcdef".repeat(25_000);
      const { parser, events } = collectSSE();
      parser.feed("data: ");
      for (let i = 0; i < data.length; i += 16) {
        parser.feed(data.slice(i, i + 16));
      }
      parser.feed("\r\n\r\n");
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe(data);
    });

    it("should stay linear for a long unterminated line that is only flushed", () => {
      const { parser, events } = collectSSE();
      parser.feed("data: ");
      for (let i = 0; i < 100_000; i += 1) {
        parser.feed("y");
      }
      expect(events).toHaveLength(0);
      parser.flush();
      expect(events[0].data).toHaveLength(100_000);
    });
  });
});
