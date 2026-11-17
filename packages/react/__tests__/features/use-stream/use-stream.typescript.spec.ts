import { Client } from "@hyper-fetch/core";
import type { ServerSentEventType } from "@hyper-fetch/core";
import { renderHook } from "@testing-library/react";
import { useStream } from "hooks/use-stream";
import type {
  UseStreamEventType,
  UseStreamFormatType,
  UseStreamOptionsType,
  UseStreamReturnType,
} from "hooks/use-stream";

const client = new Client({ url: "http://localhost:3000" });

const request = client.createRequest<{
  response: { answer: string };
  payload: { prompt: string };
  error: { message: string };
}>()({ endpoint: "/chat", method: "POST" });

type StreamRequest = typeof request;
type Token = { token: string; index: number };

describe("useStream [ Types ]", () => {
  describe("when the options are typed", () => {
    it("should accept the three formats", () => {
      expectTypeOf<UseStreamFormatType>().toEqualTypeOf<"text" | "sse" | "ndjson">();
      expectTypeOf<UseStreamOptionsType["format"]>().toEqualTypeOf<"text" | undefined>();
      expectTypeOf<UseStreamOptionsType<"sse">["format"]>().toEqualTypeOf<"sse" | undefined>();
      expectTypeOf<UseStreamOptionsType["autoStart"]>().toEqualTypeOf<boolean | undefined>();
    });

    it("should type the parsed event by the format", () => {
      expectTypeOf<UseStreamEventType<"text">>().toBeNever();
      expectTypeOf<UseStreamEventType<"sse">>().toEqualTypeOf<ServerSentEventType>();
      expectTypeOf<UseStreamEventType<"ndjson">>().toBeUnknown();
      expectTypeOf<UseStreamEventType<"ndjson", Token>>().toEqualTypeOf<Token>();
      // The NDJSON value type has no meaning for server-sent events
      expectTypeOf<UseStreamEventType<"sse", Token>>().toEqualTypeOf<ServerSentEventType>();
    });

    it("should pass the parsed event to onEvent", () => {
      expectTypeOf<NonNullable<UseStreamOptionsType<"sse">["onEvent"]>>()
        .parameter(0)
        .toEqualTypeOf<ServerSentEventType>();
      expectTypeOf<NonNullable<UseStreamOptionsType<"ndjson", Token>["onEvent"]>>().parameter(0).toEqualTypeOf<Token>();
      expectTypeOf<NonNullable<UseStreamOptionsType<"text">["onEvent"]>>().parameter(0).toBeNever();
    });

    it("should pass the raw chunk with its text and index to onChunk", () => {
      expectTypeOf<NonNullable<UseStreamOptionsType["onChunk"]>>().parameter(0).toEqualTypeOf<{
        chunk: Uint8Array;
        text: string;
        index: number;
      }>();
    });
  });

  describe("when the result is typed", () => {
    it("should expose the stream state", () => {
      type Result = UseStreamReturnType<StreamRequest>;

      expectTypeOf<Result["text"]>().toEqualTypeOf<string>();
      expectTypeOf<Result["chunks"]>().toEqualTypeOf<Uint8Array[]>();
      expectTypeOf<Result["streaming"]>().toEqualTypeOf<boolean>();
      expectTypeOf<Result["done"]>().toEqualTypeOf<boolean>();
      expectTypeOf<Result["aborted"]>().toEqualTypeOf<boolean>();
      expectTypeOf<Result["status"]>().toEqualTypeOf<number | null>();
    });

    it("should type data, error and extra from the request", () => {
      type Result = UseStreamReturnType<StreamRequest>;

      expectTypeOf<Result["data"]>().toEqualTypeOf<{ answer: string } | null>();
      expectTypeOf<NonNullable<Result["error"]>>().toMatchTypeOf<{ message: string }>();
      expectTypeOf<Result["error"]>().toBeNullable();
      expectTypeOf<NonNullable<Result["extra"]>>().toEqualTypeOf<{ headers: Record<string, string> }>();
    });

    it("should type the events by the format", () => {
      expectTypeOf<UseStreamReturnType<StreamRequest>["events"]>().toEqualTypeOf<never[]>();
      expectTypeOf<UseStreamReturnType<StreamRequest, "sse">["events"]>().toEqualTypeOf<ServerSentEventType[]>();
      expectTypeOf<UseStreamReturnType<StreamRequest, "ndjson">["events"]>().toEqualTypeOf<unknown[]>();
      expectTypeOf<UseStreamReturnType<StreamRequest, "ndjson", Token>["events"]>().toEqualTypeOf<Token[]>();
    });

    it("should expose the controls as functions without arguments", () => {
      type Result = UseStreamReturnType<StreamRequest>;

      expectTypeOf<Result["start"]>().toEqualTypeOf<() => void>();
      expectTypeOf<Result["abort"]>().toEqualTypeOf<() => void>();
      expectTypeOf<Result["reset"]>().toEqualTypeOf<() => void>();
    });
  });

  describe("when the hook is called", () => {
    it("should infer the result from the request", () => {
      const { result } = renderHook(() => useStream(request));

      expectTypeOf(result.current).toEqualTypeOf<UseStreamReturnType<StreamRequest, "text", unknown>>();
      expectTypeOf(result.current.data).toEqualTypeOf<{ answer: string } | null>();
      expectTypeOf(result.current.events).toEqualTypeOf<never[]>();
    });

    it("should infer the events from the format option", () => {
      const { result } = renderHook(() =>
        useStream(request, {
          format: "sse",
          onEvent: (event) => {
            expectTypeOf(event).toEqualTypeOf<ServerSentEventType>();
          },
        }),
      );

      expectTypeOf(result.current.events).toEqualTypeOf<ServerSentEventType[]>();
    });

    it("should type NDJSON values through the generics", () => {
      const { result } = renderHook(() =>
        useStream<StreamRequest, "ndjson", Token>(request, {
          format: "ndjson",
          onEvent: (value) => {
            expectTypeOf(value).toEqualTypeOf<Token>();
          },
        }),
      );

      expectTypeOf(result.current.events).toEqualTypeOf<Token[]>();
    });

    it("should type the chunk passed to onChunk", () => {
      renderHook(() =>
        useStream(request, {
          onChunk: ({ chunk, text, index }) => {
            expectTypeOf(chunk).toEqualTypeOf<Uint8Array>();
            expectTypeOf(text).toBeString();
            expectTypeOf(index).toBeNumber();
          },
        }),
      );
    });

    it("should reject options that do not exist", () => {
      // @ts-expect-error unknown format
      renderHook(() => useStream(request, { format: "xml" }));
      // @ts-expect-error autoStart is a boolean
      renderHook(() => useStream(request, { autoStart: "yes" }));

      expectTypeOf(useStream).parameter(0).not.toBeAny();
    });
  });
});
