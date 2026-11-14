import type { ChatMessageType, ChatPartType, ChatToolPartType } from "../../chat/chat.types";

/** AG-UI 1.0 message (`RunAgentInput.messages`, `MESSAGES_SNAPSHOT`). */
export type AGUIMessageType =
  | { id: string; role: "developer" | "system"; content: string; name?: string }
  | {
      id: string;
      role: "assistant";
      content?: string;
      name?: string;
      toolCalls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
    }
  | { id: string; role: "user"; content: string | AGUIContentPartType[]; name?: string }
  | { id: string; role: "tool"; content: string | AGUIContentPartType[]; toolCallId: string; error?: string }
  | { id: string; role: "activity"; activityType: string; content: Record<string, unknown> }
  | { id: string; role: "reasoning"; content: string };

export type AGUIContentPartType =
  | { type: "text"; text: string; id?: string }
  | {
      type: "image" | "audio" | "video" | "document";
      id?: string;
      source: { type: "data" | "url" | "file"; value: string; mimeType?: string };
    };

const getMediaType = (mimeType: string): "image" | "audio" | "video" | "document" => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  return "document";
};

const stringify = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value ?? null));

const textOf = (parts: ChatPartType[]) =>
  parts
    .filter((part): part is Extract<ChatPartType, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("");

/** Convert chat messages to AG-UI messages. Assistant tool results become separate `tool` messages. */
export const toAGUIMessages = (messages: ChatMessageType<any>[]): AGUIMessageType[] => {
  const result: AGUIMessageType[] = [];

  messages.forEach((message) => {
    if (message.role === "system") {
      result.push({ id: message.id, role: "system", content: textOf(message.parts) });
      return;
    }

    if (message.role === "user") {
      const files = message.parts.filter((part) => part.type === "file");
      if (files.length === 0) {
        result.push({ id: message.id, role: "user", content: textOf(message.parts) });
        return;
      }
      const content: AGUIContentPartType[] = [];
      message.parts.forEach((part) => {
        if (part.type === "text") {
          content.push({ type: "text", text: part.text });
        } else if (part.type === "file") {
          content.push({
            type: getMediaType(part.mediaType),
            source: part.url.startsWith("data:")
              ? { type: "data", value: part.url.slice(part.url.indexOf(",") + 1), mimeType: part.mediaType }
              : { type: "url", value: part.url, mimeType: part.mediaType },
          });
        }
      });
      result.push({ id: message.id, role: "user", content });
      return;
    }

    // Every step of an assistant message becomes one AG-UI assistant message followed by its tool results
    const steps: ChatPartType[][] = [[]];
    message.parts.forEach((part) => {
      if (part.type === "step-start") {
        if (steps[steps.length - 1].length > 0) {
          steps.push([]);
        }
      } else {
        steps[steps.length - 1].push(part);
      }
    });

    steps.forEach((parts, stepIndex) => {
      const tools = parts.filter((part): part is ChatToolPartType => part.type === "tool");
      const text = textOf(parts);
      if (!text && tools.length === 0) {
        return;
      }
      const id = stepIndex === 0 ? message.id : `${message.id}-${stepIndex}`;
      result.push({
        id,
        role: "assistant",
        ...(text && { content: text }),
        ...(tools.length > 0 && {
          toolCalls: tools.map((tool) => ({
            id: tool.toolCallId,
            type: "function" as const,
            function: { name: tool.toolName, arguments: JSON.stringify(tool.input ?? {}) },
          })),
        }),
      });
      tools.forEach((tool) => {
        if (tool.state === "output-available") {
          result.push({
            id: `${tool.toolCallId}-result`,
            role: "tool",
            toolCallId: tool.toolCallId,
            content: stringify(tool.output),
          });
        } else if (tool.state === "output-error") {
          result.push({
            id: `${tool.toolCallId}-result`,
            role: "tool",
            toolCallId: tool.toolCallId,
            content: "",
            error: tool.errorText,
          });
        } else if (tool.state === "output-denied") {
          result.push({
            id: `${tool.toolCallId}-result`,
            role: "tool",
            toolCallId: tool.toolCallId,
            content: "",
            error: "Tool execution was denied",
          });
        }
      });
    });
  });

  return result;
};

/** Parse a tool result: JSON when possible, the raw string otherwise. */
export const parseToolContent = (content: unknown): unknown => {
  if (typeof content !== "string") {
    return content;
  }
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
};

const parseArguments = (args: string): unknown => {
  if (!args.trim()) {
    return {};
  }
  try {
    return JSON.parse(args);
  } catch {
    return args;
  }
};

/**
 * Convert AG-UI messages (e.g. from `MESSAGES_SNAPSHOT`) to chat messages. Consecutive assistant, tool, reasoning and
 * activity messages are merged into one assistant message, with a step boundary for every assistant message.
 */
export const fromAGUIMessages = <M extends ChatMessageType<any> = ChatMessageType>(
  messages: readonly AGUIMessageType[],
): M[] => {
  const result: ChatMessageType[] = [];
  let assistant: ChatMessageType | null = null;

  const getAssistant = (id: string) => {
    if (!assistant) {
      assistant = { id, role: "assistant", parts: [] };
      result.push(assistant);
    }
    return assistant;
  };

  messages.forEach((message) => {
    switch (message.role) {
      case "user": {
        assistant = null;
        const parts: ChatPartType[] = [];
        if (typeof message.content === "string") {
          parts.push({ type: "text", id: `${message.id}-0`, text: message.content, state: "done" });
        } else {
          message.content.forEach((part, index) => {
            if (part.type === "text") {
              parts.push({ type: "text", id: part.id ?? `${message.id}-${index}`, text: part.text, state: "done" });
            } else {
              const mediaType = part.source.mimeType ?? "application/octet-stream";
              parts.push({
                type: "file",
                mediaType,
                url: part.source.type === "data" ? `data:${mediaType};base64,${part.source.value}` : part.source.value,
              });
            }
          });
        }
        result.push({ id: message.id, role: "user", parts });
        return;
      }
      case "system":
      case "developer": {
        assistant = null;
        result.push({
          id: message.id,
          role: "system",
          parts: [{ type: "text", id: `${message.id}-0`, text: message.content, state: "done" }],
        });
        return;
      }
      case "assistant": {
        const target = getAssistant(message.id);
        if (target.parts.length > 0) {
          target.parts.push({ type: "step-start" });
        }
        if (message.content) {
          target.parts.push({ type: "text", id: message.id, text: message.content, state: "done" });
        }
        message.toolCalls?.forEach((call) => {
          target.parts.push({
            type: "tool",
            toolName: call.function.name,
            toolCallId: call.id,
            state: "input-available",
            input: parseArguments(call.function.arguments),
          } as ChatPartType);
        });
        return;
      }
      case "tool": {
        const target = getAssistant(message.id);
        const index = target.parts.findIndex((part) => part.type === "tool" && part.toolCallId === message.toolCallId);
        if (index === -1) {
          return;
        }
        const part = target.parts[index] as ChatToolPartType;
        target.parts[index] = (
          message.error
            ? { ...part, state: "output-error", errorText: message.error }
            : { ...part, state: "output-available", output: parseToolContent(message.content) }
        ) as ChatPartType;
        return;
      }
      case "reasoning": {
        getAssistant(message.id).parts.push({
          type: "reasoning",
          id: message.id,
          text: message.content,
          state: "done",
        });
        return;
      }
      case "activity": {
        getAssistant(message.id).parts.push({
          type: "data",
          name: "activity",
          id: message.id,
          data: { activityType: message.activityType, content: message.content },
        } as ChatPartType);
        return;
      }
      default: {
        // Unknown roles are skipped
      }
    }
  });

  return result as M[];
};
