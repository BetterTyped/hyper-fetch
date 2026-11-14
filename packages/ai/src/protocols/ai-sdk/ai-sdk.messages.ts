import type { ChatMessageType, ChatPartType, ChatToolPartType } from "../../chat/chat.types";

/** Loose shape of an AI SDK `UIMessage` (v5-v7) - only what the converters read and write. */
export type AISDKUIMessageType = {
  id: string;
  role: "system" | "user" | "assistant";
  metadata?: unknown;
  parts: AISDKUIPartType[];
};

export type AISDKUIPartType = { type: string; [key: string]: unknown };

const toAISDKApproval = (approval: Record<string, unknown> | undefined) => {
  if (!approval) {
    return undefined;
  }
  return {
    id: approval.id,
    ...(approval.approved !== undefined && { approved: approval.approved }),
    ...(approval.responseReason !== undefined && { reason: approval.responseReason }),
  };
};

const toAISDKToolPart = (part: ChatToolPartType): AISDKUIPartType => {
  const raw = part as ChatToolPartType & {
    output?: unknown;
    errorText?: string;
    approval?: Record<string, unknown>;
    preliminary?: boolean;
    rawInput?: string;
  };
  const approval = toAISDKApproval(raw.approval);
  return {
    ...(part.dynamic ? { type: "dynamic-tool", toolName: part.toolName } : { type: `tool-${part.toolName}` }),
    toolCallId: part.toolCallId,
    state: part.state,
    input: part.input,
    ...(raw.rawInput !== undefined && { rawInput: raw.rawInput }),
    ...(raw.output !== undefined && { output: raw.output }),
    ...(raw.errorText !== undefined && { errorText: raw.errorText }),
    ...(approval && { approval }),
    ...(raw.preliminary && { preliminary: true }),
    ...(part.providerExecuted !== undefined && { providerExecuted: part.providerExecuted }),
    ...(part.title !== undefined && { title: part.title }),
  };
};

const toAISDKPart = (part: ChatPartType): AISDKUIPartType | null => {
  switch (part.type) {
    case "text":
    case "reasoning": {
      return { type: part.type, text: part.text, state: part.state };
    }
    case "source": {
      return part.sourceType === "url"
        ? {
            type: "source-url",
            sourceId: part.sourceId,
            url: part.url,
            ...(part.title !== undefined && { title: part.title }),
          }
        : {
            type: "source-document",
            sourceId: part.sourceId,
            mediaType: part.mediaType,
            title: part.title ?? "",
            ...(part.filename !== undefined && { filename: part.filename }),
          };
    }
    case "file": {
      return {
        type: "file",
        mediaType: part.mediaType,
        url: part.url,
        ...(part.filename !== undefined && { filename: part.filename }),
      };
    }
    case "step-start": {
      return { type: "step-start" };
    }
    case "data": {
      return { type: `data-${part.name}`, ...(part.id !== undefined && { id: part.id }), data: part.data };
    }
    case "tool": {
      return toAISDKToolPart(part);
    }
    default: {
      return null;
    }
  }
};

/** Convert chat messages to AI SDK `UIMessage`s (what `useChat`'s default transport POSTs). */
export const toAISDKMessages = (messages: ChatMessageType<any>[]): AISDKUIMessageType[] =>
  messages.map((message) => ({
    id: message.id,
    role: message.role,
    ...(message.metadata !== undefined && { metadata: message.metadata }),
    parts: message.parts.map(toAISDKPart).filter((part): part is AISDKUIPartType => part !== null),
  }));

const fromAISDKApproval = (approval: unknown) => {
  if (!approval || typeof approval !== "object") {
    return undefined;
  }
  const value = approval as Record<string, unknown>;
  return {
    id: String(value.id),
    ...(typeof value.requestReason === "string" && { reason: value.requestReason }),
    ...(typeof value.approved === "boolean" && { approved: value.approved }),
    ...(typeof value.reason === "string" && { responseReason: value.reason }),
  };
};

const fromAISDKPart = (part: AISDKUIPartType, index: number, messageId: string): ChatPartType | null => {
  const { type } = part;
  if (type === "text" || type === "reasoning") {
    return {
      type,
      id: typeof part.id === "string" ? part.id : `${messageId}-${index}`,
      text: String(part.text ?? ""),
      state: part.state === "streaming" ? "streaming" : "done",
    };
  }
  if (type === "source-url") {
    return {
      type: "source",
      sourceType: "url",
      sourceId: String(part.sourceId),
      url: String(part.url),
      ...(typeof part.title === "string" && { title: part.title }),
    };
  }
  if (type === "source-document") {
    return {
      type: "source",
      sourceType: "document",
      sourceId: String(part.sourceId),
      mediaType: String(part.mediaType),
      ...(typeof part.title === "string" && { title: part.title }),
      ...(typeof part.filename === "string" && { filename: part.filename }),
    };
  }
  if (type === "file") {
    return {
      type: "file",
      url: String(part.url),
      mediaType: String(part.mediaType),
      ...(typeof part.filename === "string" && { filename: part.filename }),
    };
  }
  if (type === "step-start") {
    return { type: "step-start" };
  }
  if (type.startsWith("data-")) {
    return {
      type: "data",
      name: type.slice("data-".length),
      ...(typeof part.id === "string" && { id: part.id }),
      data: part.data,
    } as ChatPartType;
  }
  if (type.startsWith("tool-") || type === "dynamic-tool") {
    const approval = fromAISDKApproval(part.approval);
    return {
      type: "tool",
      toolName: type === "dynamic-tool" ? String(part.toolName) : type.slice("tool-".length),
      toolCallId: String(part.toolCallId),
      state: part.state,
      input: part.input,
      ...(type === "dynamic-tool" && { dynamic: true }),
      ...(part.output !== undefined && { output: part.output }),
      ...(typeof part.errorText === "string" && { errorText: part.errorText }),
      ...(typeof part.rawInput === "string" && { rawInput: part.rawInput }),
      ...(approval && { approval }),
      ...(part.preliminary === true && { preliminary: true }),
      ...(typeof part.providerExecuted === "boolean" && { providerExecuted: part.providerExecuted }),
      ...(typeof part.title === "string" && { title: part.title }),
    } as ChatPartType;
  }
  return null;
};

/** Convert AI SDK `UIMessage`s (e.g. persisted chat history) to chat messages. Unknown part types are skipped. */
export const fromAISDKMessages = <M extends ChatMessageType<any> = ChatMessageType>(
  messages: readonly AISDKUIMessageType[],
): M[] =>
  messages.map(
    (message) =>
      ({
        id: message.id,
        role: message.role,
        ...(message.metadata !== undefined && { metadata: message.metadata }),
        parts: message.parts
          .map((part, index) => fromAISDKPart(part, index, message.id))
          .filter((part): part is ChatPartType => part !== null),
      }) as M,
  );
