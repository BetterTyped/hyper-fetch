import type { RequestInstance } from "@hyper-fetch/core";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { Chat } from "../chat/chat";
import type { ChatOptionsType, ChatSnapshotType } from "../chat/chat.options";
import type { ChatTypes } from "../chat/chat.types";

export type UseChatOptionsType<T extends ChatTypes, R extends RequestInstance> = ChatOptionsType<T, R> & {
  /** Use an existing chat store, e.g. to share one chat between components */
  chat?: Chat<T, R>;
  /** Re-render at most once per `throttleMs` while streaming */
  throttleMs?: number;
  /** Call `resumeStream()` on mount to reconnect to a running stream (requires `resumeRequest`) */
  resume?: boolean;
};

export type UseChatReturnType<T extends ChatTypes, R extends RequestInstance> = ChatSnapshotType<T, R> & {
  chat: Chat<T, R>;
  sendMessage: Chat<T, R>["sendMessage"];
  regenerate: Chat<T, R>["regenerate"];
  resumeStream: Chat<T, R>["resumeStream"];
  stop: Chat<T, R>["stop"];
  setMessages: Chat<T, R>["setMessages"];
  setState: Chat<T, R>["setState"];
  clearError: Chat<T, R>["clearError"];
  addToolResult: Chat<T, R>["addToolResult"];
  addToolApprovalResponse: Chat<T, R>["addToolApprovalResponse"];
  resolveInterrupt: Chat<T, R>["resolveInterrupt"];
};

const throttle = (listener: () => void, ms: number) => {
  let last = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const throttled = () => {
    const remaining = ms - (Date.now() - last);
    if (remaining <= 0) {
      last = Date.now();
      listener();
    } else if (!timeout) {
      timeout = setTimeout(() => {
        timeout = undefined;
        last = Date.now();
        listener();
      }, remaining);
    }
  };
  return { throttled, cancel: () => clearTimeout(timeout) };
};

/**
 * Provider-agnostic chat hook. Pass a HyperFetch request for your chat endpoint and the protocol of your backend
 * (`aiSDKProtocol()`, `tanstackAIProtocol()`, `aguiProtocol()`), and type it with your backend's chat types.
 */
export const useChat = <T extends ChatTypes = ChatTypes, R extends RequestInstance = RequestInstance>(
  options: UseChatOptionsType<T, R>,
): UseChatReturnType<T, R> => {
  const { chat: externalChat, throttleMs, resume, ...chatOptions } = options;

  const chatRef = useRef<Chat<T, R> | null>(null);
  const ownsChat = !externalChat;
  let chat: Chat<T, R>;
  if (externalChat) {
    chat = externalChat;
  } else if (!chatRef.current || (chatOptions.id !== undefined && chatRef.current.id !== chatOptions.id)) {
    chat = new Chat<T, R>(chatOptions);
  } else {
    chat = chatRef.current;
  }
  chatRef.current = chat;

  // Keep callbacks, body and tools fresh without recreating the chat
  chat.setOptions(chatOptions);

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!throttleMs) {
        return chat.subscribe(listener);
      }
      const { throttled, cancel } = throttle(listener, throttleMs);
      const unsubscribe = chat.subscribe(throttled);
      return () => {
        unsubscribe();
        cancel();
      };
    },
    [chat, throttleMs],
  );

  const snapshot = useSyncExternalStore(subscribe, chat.getSnapshot, chat.getSnapshot);

  const resumeRef = useRef(resume);
  useEffect(() => {
    if (resumeRef.current) {
      chat.resumeStream().catch(() => {});
    }
  }, [chat]);

  // Stop streaming when the component that owns the chat unmounts
  useEffect(() => {
    return () => {
      if (ownsChat) {
        chat.stop();
      }
    };
  }, [chat, ownsChat]);

  return {
    ...snapshot,
    chat,
    sendMessage: chat.sendMessage,
    regenerate: chat.regenerate,
    resumeStream: chat.resumeStream,
    stop: chat.stop,
    setMessages: chat.setMessages,
    setState: chat.setState,
    clearError: chat.clearError,
    addToolResult: chat.addToolResult,
    addToolApprovalResponse: chat.addToolApprovalResponse,
    resolveInterrupt: chat.resolveInterrupt,
  };
};
