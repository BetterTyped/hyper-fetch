/**
 * Differential test helpers: run the same wire bytes through the Vercel AI SDK's own client (`AbstractChat` with its
 * `DefaultChatTransport`, the code behind `useChat`) and through our decoder + message builder, then compare.
 */
import type { ChatMessageType, ChatStreamEventType } from "@hyper-fetch/ai";
import { aiSDKProtocol, ChatMessageBuilder, encodeAISDKStream, toAISDKMessages } from "@hyper-fetch/ai";
import type { ChatInit, ChatState, ChatStatus, UIMessage, UIMessageChunk } from "ai";
import { AbstractChat, DefaultChatTransport } from "ai";

export type AnyChunk = UIMessageChunk | { type: string; [key: string]: unknown };

/* -------------------------------------------------------------------------------------------------
 * Reference - the AI SDK client
 * -----------------------------------------------------------------------------------------------*/

/** The plain store `useChat` implementations give to `AbstractChat`. */
const createReferenceState = (messages: UIMessage[]): ChatState<UIMessage> => {
  const snapshot = <T>(value: T): T => structuredClone(value);
  const state: ChatState<UIMessage> = {
    status: "ready" as ChatStatus,
    error: undefined,
    messages,
    pushMessage: (message) => {
      state.messages = [...state.messages, message];
    },
    popMessage: () => {
      state.messages = state.messages.slice(0, -1);
    },
    replaceMessage: (index, message) => {
      state.messages = [...state.messages.slice(0, index), snapshot(message), ...state.messages.slice(index + 1)];
    },
    snapshot,
  };
  return state;
};

export type ReferenceRequestType = { id: string; messages: UIMessage[]; trigger: string; messageId?: string };

/**
 * The AI SDK chat (what `useChat` wraps) talking to a fake `fetch` that answers every request with the next wire
 * body from `responses` - so the reference parses exactly the bytes our decoder gets.
 */
export class ReferenceChat extends AbstractChat<UIMessage> {
  readonly requests: ReferenceRequestType[];

  constructor({
    responses,
    messages = [],
    ...init
  }: {
    /** Wire bodies answered in order, or a function that answers a request (e.g. a real AI SDK backend) */
    responses: string[] | ((request: ReferenceRequestType) => string | Promise<string>);
    messages?: UIMessage[];
  } & Omit<ChatInit<UIMessage>, "messages" | "transport">) {
    const requests: ReferenceRequestType[] = [];
    let ids = 0;
    super({
      generateId: () => {
        ids += 1;
        return `ref-${ids}`;
      },
      ...init,
      state: createReferenceState(messages),
      transport: new DefaultChatTransport({
        api: "http://reference.test/api/chat",
        fetch: async (_url, request) => {
          const sent = JSON.parse(String(request?.body)) as ReferenceRequestType;
          requests.push(sent);
          const body =
            typeof responses === "function"
              ? await responses(sent)
              : responses[Math.min(requests.length - 1, responses.length - 1)];
          return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
        },
      }),
    });
    this.requests = requests;
  }

  get assistant(): UIMessage | undefined {
    return this.messages.findLast((message) => message.role === "assistant");
  }
}

/** Answer one user message with `wire` and return what the AI SDK client made of it. */
export const runReference = async (wire: string, options: { messages?: UIMessage[] } = {}) => {
  const chat = new ReferenceChat({ responses: [wire], ...options });
  await chat.sendMessage({ text: "Hi" });
  return chat;
};

/* -------------------------------------------------------------------------------------------------
 * Ours - decoder + message builder
 * -----------------------------------------------------------------------------------------------*/

export const createOurs = (base?: ChatMessageType) => {
  const events: ChatStreamEventType[] = [];
  const builder = new ChatMessageBuilder(base ?? { id: "local", role: "assistant", parts: [] });
  const decoder = aiSDKProtocol().createDecoder((event) => {
    events.push(event);
    builder.apply(event);
  });
  return { events, builder, decoder };
};

/** Decode `wire` (one string or network pieces) and build the assistant message, like `Chat` does. */
export const runOurs = (wire: string | string[], base?: ChatMessageType) => {
  const ours = createOurs(base);
  (typeof wire === "string" ? [wire] : wire).forEach((piece) => ours.decoder.feed(piece));
  ours.decoder.flush();
  return { events: ours.events, builder: ours.builder, message: ours.builder.message };
};

export const toWire = (chunks: AnyChunk[], options: { done?: boolean } = {}) =>
  encodeAISDKStream(chunks as { type: string }[], options).join("");

/* -------------------------------------------------------------------------------------------------
 * Comparison
 * -----------------------------------------------------------------------------------------------*/

/** Fields of AI SDK UI message parts that our message model does not carry (reported, not compared). */
const UNSUPPORTED_PART_KEYS = new Set([
  "providerMetadata",
  "callProviderMetadata",
  "resultProviderMetadata",
  "toolMetadata",
  "inputEncoding",
  "citations",
  "transient",
]);
const UNSUPPORTED_PART_TYPES = new Set(["custom", "reasoning-file", "steering-message"]);
const UNSUPPORTED_APPROVAL_KEYS = new Set(["descriptor", "inputSchemaInput", "isAutomatic", "signature"]);

const dropKeys = (value: Record<string, unknown>, keys: Set<string>) =>
  Object.fromEntries(Object.entries(value).filter(([key]) => !keys.has(key)));

/** Through JSON, like on the wire: `undefined` fields are gone */
const json = <T>(value: T): T => {
  const text = JSON.stringify(value);
  return JSON.parse(text) as T;
};

type LoosePart = { type: string; [key: string]: unknown };

/** Parts of a reference `UIMessage`, reduced to what our message model can represent. */
export const comparableParts = (message: { parts: readonly unknown[] } | undefined): LoosePart[] =>
  json((message?.parts ?? []) as LoosePart[])
    .filter((part) => !UNSUPPORTED_PART_TYPES.has(part.type))
    .map((part) => {
      const { id, ...rest } = dropKeys(part, UNSUPPORTED_PART_KEYS) as LoosePart & { id?: unknown };
      const next: LoosePart = part.type === "reasoning" || id === undefined ? rest : { ...rest, id };
      if (next.approval && typeof next.approval === "object") {
        next.approval = dropKeys(next.approval as Record<string, unknown>, UNSUPPORTED_APPROVAL_KEYS);
      }
      return next;
    });

/** Our message as the AI SDK `UIMessage` we would send back to the server. */
export const oursAsUIMessage = (message: ChatMessageType) => json(toAISDKMessages([message])[0]);

export const oursAsParts = (message: ChatMessageType) => oursAsUIMessage(message).parts;

/** Run both sides on the same wire text. */
export const runBoth = async (wire: string) => {
  const reference = await runReference(wire);
  const ours = runOurs(wire);
  return { reference, ours };
};
