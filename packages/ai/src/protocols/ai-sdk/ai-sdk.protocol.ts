import { createSSEParser } from "@hyper-fetch/core";
import type { StreamParserType } from "@hyper-fetch/core";

import type { ChatFinishReasonType, ChatStreamEventType } from "../../chat/chat.types";
import type { ChatPrepareRequestContextType, ChatProtocolType } from "../protocol.types";
import { toAISDKMessages } from "./ai-sdk.messages";

export type AISDKProtocolOptionsType = {
  /**
   * Replace the request body (AI SDK `prepareSendMessagesRequest`). Receives the default body, return the one to send.
   */
  prepareBody?: (context: ChatPrepareRequestContextType & { defaultBody: Record<string, unknown> }) => unknown;
};

type Chunk = { type: string; [key: string]: unknown };

const FINISH_REASONS: ChatFinishReasonType[] = [
  "stop",
  "length",
  "content-filter",
  "tool-calls",
  "error",
  "interrupted",
  "other",
  "unknown",
];

const toFinishReason = (value: unknown): ChatFinishReasonType | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  return FINISH_REASONS.includes(value as ChatFinishReasonType) ? (value as ChatFinishReasonType) : "other";
};

const optional = <K extends string>(key: K, value: unknown, type: "string" | "boolean") =>
  // eslint-disable-next-line valid-typeof
  typeof value === type ? ({ [key]: value } as Record<K, never>) : {};

/** AI SDK ignores `null` message metadata, so it is not an update */
const hasMetadata = (chunk: Chunk) => chunk.messageMetadata !== undefined && chunk.messageMetadata !== null;

/** Map one AI SDK UI message stream chunk (v5-v7) to normalized events. */
export const mapAISDKChunk = (chunk: Chunk): ChatStreamEventType[] => {
  if (!chunk || typeof chunk !== "object") {
    // Not a chunk at all (e.g. a bare `null` or a number on the wire)
    return [{ type: "raw", protocol: "ai-sdk", value: chunk }];
  }
  const str = (key: string) => String(chunk[key] ?? "");
  switch (chunk.type) {
    case "start": {
      return [
        {
          type: "message-start",
          ...optional("messageId", chunk.messageId, "string"),
          ...(hasMetadata(chunk) && { metadata: chunk.messageMetadata }),
        },
      ];
    }
    case "start-step": {
      return [{ type: "step-start" }];
    }
    case "finish-step": {
      return [{ type: "step-finish" }];
    }
    case "reset-step": {
      return [{ type: "step-reset" }];
    }
    case "text-start":
    case "text-end":
    case "reasoning-start":
    case "reasoning-end": {
      return [{ type: chunk.type, id: str("id") }];
    }
    case "text-delta":
    case "reasoning-delta": {
      return [{ type: chunk.type, id: str("id"), delta: str("delta") }];
    }
    case "tool-input-start": {
      return [
        {
          type: "tool-input-start",
          toolCallId: str("toolCallId"),
          toolName: str("toolName"),
          ...optional("providerExecuted", chunk.providerExecuted, "boolean"),
          ...optional("dynamic", chunk.dynamic, "boolean"),
          ...optional("title", chunk.title, "string"),
        },
      ];
    }
    case "tool-input-delta": {
      return [{ type: "tool-input-delta", toolCallId: str("toolCallId"), delta: str("inputTextDelta") }];
    }
    case "tool-input-available": {
      return [
        {
          type: "tool-input-available",
          toolCallId: str("toolCallId"),
          toolName: str("toolName"),
          input: chunk.input,
          ...optional("providerExecuted", chunk.providerExecuted, "boolean"),
          ...optional("dynamic", chunk.dynamic, "boolean"),
          ...optional("title", chunk.title, "string"),
        },
      ];
    }
    case "tool-input-error": {
      return [
        {
          type: "tool-input-error",
          toolCallId: str("toolCallId"),
          toolName: str("toolName"),
          input: chunk.input,
          errorText: str("errorText"),
        },
      ];
    }
    case "tool-approval-request": {
      return [
        {
          type: "tool-approval-request",
          toolCallId: str("toolCallId"),
          approvalId: str("approvalId"),
          ...optional("reason", chunk.reason, "string"),
        },
      ];
    }
    case "tool-approval-response": {
      return [
        {
          type: "tool-approval-response",
          approvalId: str("approvalId"),
          approved: chunk.approved === true,
          ...optional("reason", chunk.reason, "string"),
        },
      ];
    }
    case "tool-output-available": {
      return [
        {
          type: "tool-output-available",
          toolCallId: str("toolCallId"),
          output: chunk.output,
          ...(chunk.preliminary === true && { preliminary: true }),
        },
      ];
    }
    case "tool-output-error": {
      return [{ type: "tool-output-error", toolCallId: str("toolCallId"), errorText: str("errorText") }];
    }
    case "tool-output-denied": {
      return [{ type: "tool-output-denied", toolCallId: str("toolCallId") }];
    }
    case "source-url": {
      return [
        {
          type: "source",
          sourceType: "url",
          sourceId: str("sourceId"),
          url: str("url"),
          ...optional("title", chunk.title, "string"),
        },
      ];
    }
    case "source-document": {
      return [
        {
          type: "source",
          sourceType: "document",
          sourceId: str("sourceId"),
          mediaType: str("mediaType"),
          ...optional("title", chunk.title, "string"),
          ...optional("filename", chunk.filename, "string"),
        },
      ];
    }
    case "file": {
      return [{ type: "file", url: str("url"), mediaType: str("mediaType") }];
    }
    case "finish": {
      const finishReason = toFinishReason(chunk.finishReason);
      return [
        {
          type: "finish",
          ...(finishReason && { finishReason }),
          ...(hasMetadata(chunk) && { metadata: chunk.messageMetadata }),
        },
      ];
    }
    case "message-metadata": {
      return [{ type: "message-metadata", metadata: hasMetadata(chunk) ? chunk.messageMetadata : undefined }];
    }
    case "error": {
      return [{ type: "error", errorText: str("errorText") || "An error occurred." }];
    }
    case "abort": {
      return [{ type: "abort", ...optional("reason", chunk.reason, "string") }];
    }
    default: {
      if (typeof chunk.type === "string" && chunk.type.startsWith("data-")) {
        return [
          {
            type: "data",
            name: chunk.type.slice("data-".length),
            ...optional("id", chunk.id, "string"),
            data: chunk.data,
            ...(chunk.transient === true && { transient: true }),
          },
        ];
      }
      return [{ type: "raw", protocol: "ai-sdk", value: chunk }];
    }
  }
};

const createDefaultBody = (context: ChatPrepareRequestContextType) => ({
  ...context.body,
  id: context.chatId,
  messages: toAISDKMessages(context.messages),
  trigger: context.trigger,
  messageId: context.messageId,
});

/**
 * Vercel AI SDK UI message stream protocol - what `streamText(...).toUIMessageStreamResponse()` /
 * `createUIMessageStreamResponse()` send and what AI SDK's `useChat` consumes (v5, v6 and v7).
 */
export const aiSDKProtocol = (options: AISDKProtocolOptionsType = {}): ChatProtocolType => ({
  name: "ai-sdk",
  prepareRequest: (context) => {
    if (context.trigger === "resume-stream") {
      return { payload: undefined };
    }
    const defaultBody = createDefaultBody(context);
    return { payload: options.prepareBody ? options.prepareBody({ ...context, defaultBody }) : defaultBody };
  },
  createDecoder: (emit): StreamParserType =>
    createSSEParser({
      onEvent: ({ data }) => {
        if (data === "[DONE]" || data === "") {
          return;
        }
        let chunk: Chunk;
        try {
          chunk = JSON.parse(data) as Chunk;
        } catch (error) {
          throw new Error(`Invalid AI SDK stream chunk: ${data.slice(0, 200)}`, { cause: error });
        }
        mapAISDKChunk(chunk).forEach(emit);
      },
    }),
});

/**
 * Vercel AI SDK plain text stream protocol - `createTextStreamResponse()` / `toTextStreamResponse()`. Every chunk is
 * a text delta; tools, data parts and metadata are not available with this format.
 */
export const aiSDKTextProtocol = (options: AISDKProtocolOptionsType = {}): ChatProtocolType => ({
  name: "ai-sdk-text",
  prepareRequest: aiSDKProtocol(options).prepareRequest,
  createDecoder: (emit): StreamParserType => {
    let started = false;
    let ended = false;
    const textId = "text-1";
    const start = () => {
      if (started) {
        return;
      }
      started = true;
      emit({ type: "message-start" });
      emit({ type: "step-start" });
      emit({ type: "text-start", id: textId });
    };
    return {
      feed: (text) => {
        if (!text) {
          return;
        }
        start();
        emit({ type: "text-delta", id: textId, delta: text });
      },
      flush: () => {
        if (!started || ended) {
          return;
        }
        ended = true;
        emit({ type: "text-end", id: textId });
        emit({ type: "step-finish" });
        emit({ type: "finish", finishReason: "stop" });
      },
      reset: () => {
        started = false;
        ended = false;
      },
    };
  },
});
