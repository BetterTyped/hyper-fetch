import type { ChatMessageType, ChatStreamEventType } from "@hyper-fetch/ai";
import { aiSDKProtocol, aiSDKTextAnswer, Chat, ChatStreamError } from "@hyper-fetch/ai";
import { useChat } from "@hyper-fetch/ai/react";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";

import { aiSDK, createMockedEndpoint, deferred } from "../chat/chat.utils";

const textOf = (message: ChatMessageType<any> | undefined) =>
  message?.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

const onFirst = (type: ChatStreamEventType["type"]) => {
  const seen = deferred();
  return { seen: seen.promise, onEvent: (event: ChatStreamEventType) => event.type === type && seen.resolve() };
};

const longAnswer = "one two three four five six seven eight";

describe("useChat [ Lifecycle ]", () => {
  it("should go through submitted, streaming and ready", async () => {
    const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("Hello there"))], { chunkTime: 1 });
    const statuses: string[] = [];
    const { result } = renderHook(() => {
      const chat = useChat({ request, protocol: aiSDKProtocol() });
      if (statuses.at(-1) !== chat.status) {
        statuses.push(chat.status);
      }
      return chat;
    });

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(statuses).toEqual(["ready", "submitted", "streaming", "ready"]);
  });

  it("should show the error and recover with clearError", async () => {
    const { request } = createMockedEndpoint([
      aiSDK([{ type: "start" }, { type: "error", errorText: "Model overloaded" }]),
      aiSDK(aiSDKTextAnswer("Recovered")),
    ]);
    const onError = vi.fn();
    const { result } = renderHook(() => useChat({ request, protocol: aiSDKProtocol(), onError }));

    await act(async () => {
      await result.current.sendMessage("Hi");
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBeInstanceOf(ChatStreamError);
    expect(onError).toHaveBeenCalledTimes(1);

    act(() => result.current.clearError());
    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBeUndefined();

    await act(async () => {
      await result.current.regenerate();
    });
    expect(result.current.status).toBe("ready");
    expect(textOf(result.current.messages.at(-1))).toBe("Recovered");
  });

  it("should send a new message right after stop()", async () => {
    const { request, calls } = createMockedEndpoint(
      [aiSDK(aiSDKTextAnswer(longAnswer)), aiSDK(aiSDKTextAnswer("Second"))],
      {
        chunkTime: 2,
      },
    );
    const { seen, onEvent } = onFirst("text-delta");
    const { result } = renderHook(() => useChat({ request, protocol: aiSDKProtocol(), onEvent }));

    let first: Promise<void> | undefined;
    act(() => {
      first = result.current.sendMessage("first");
    });
    await act(async () => {
      await seen;
      result.current.stop();
      await result.current.sendMessage("second");
      await first;
    });

    expect(calls).toHaveLength(2);
    expect(result.current.status).toBe("ready");
    expect(result.current.messages.map((message) => message.role)).toEqual(["user", "assistant", "user", "assistant"]);
    expect(textOf(result.current.messages[3])).toBe("Second");
  });

  it("should stop the old chat when the id changes", async () => {
    const { client, request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer(longAnswer))], { chunkTime: 2 });
    const { seen, onEvent } = onFirst("text-delta");
    const { result, rerender } = renderHook(({ id }) => useChat({ id, request, protocol: aiSDKProtocol(), onEvent }), {
      initialProps: { id: "a" },
    });
    const first = result.current.chat;

    let sent: Promise<void> | undefined;
    act(() => {
      sent = first.sendMessage("Hi");
    });
    await act(async () => {
      await seen;
    });
    const chunksAfterSwitch = vi.fn();
    rerender({ id: "b" });
    client.requestManager.events.onResponseChunk(chunksAfterSwitch);
    await act(async () => {
      await sent;
    });

    expect(result.current.chat).not.toBe(first);
    expect(result.current.messages).toEqual([]);
    expect(result.current.status).toBe("ready");
    expect(first.status).toBe("ready");
    expect(textOf(first.messages[1])).toBe("one ");
    expect(chunksAfterSwitch).not.toHaveBeenCalled();
  });

  it("should keep an external chat streaming when the component unmounts", async () => {
    const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer(longAnswer))], { chunkTime: 2 });
    const { seen, onEvent } = onFirst("text-delta");
    const chat = new Chat({ request, protocol: aiSDKProtocol(), onEvent });
    const { unmount } = renderHook(() => useChat({ chat, request, protocol: aiSDKProtocol(), onEvent }));

    const sent = chat.sendMessage("Hi");
    await act(async () => {
      await seen;
    });
    unmount();
    await sent;

    expect(chat.status).toBe("ready");
    expect(textOf(chat.messages[1])).toBe(longAnswer);
  });

  it("should show the complete answer when re-renders are throttled", async () => {
    const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer(longAnswer))], { chunkTime: 1 });
    const { result } = renderHook(() => useChat({ request, protocol: aiSDKProtocol(), throttleMs: 1000 }));

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    // The trailing update is still pending behind the throttle - the store itself is already complete
    expect(textOf(result.current.chat.messages[1])).toBe(longAnswer);
    await waitFor(() => expect(result.current.status).toBe("ready"), { timeout: 3000 });
    expect(textOf(result.current.messages[1])).toBe(longAnswer);
  });

  it("should not update a throttled component after it unmounts", async () => {
    vi.useFakeTimers();
    try {
      const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer(longAnswer))], { chunkTime: 1 });
      const chat = new Chat({ request, protocol: aiSDKProtocol() });
      let renders = 0;
      const { unmount } = renderHook(() => {
        renders += 1;
        return useChat({ chat, request, protocol: aiSDKProtocol(), throttleMs: 200 });
      });

      const sent = chat.sendMessage("Hi");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60);
      });
      unmount();
      const rendersAtUnmount = renders;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      await sent;

      expect(renders).toBe(rendersAtUnmount);
      expect(chat.status).toBe("ready");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should render without gaps when messages are cleared while streaming", async () => {
    const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer(longAnswer))], { chunkTime: 2 });
    const { seen, onEvent } = onFirst("text-delta");
    let api: ReturnType<typeof useChat> | undefined;
    const View = () => {
      const chat = useChat({ request, protocol: aiSDKProtocol(), onEvent });
      api = chat;
      return (
        <ul>
          {chat.messages.map((message) => (
            <li key={message.id} data-testid="message">
              {message.role}: {textOf(message)}
            </li>
          ))}
        </ul>
      );
    };
    render(<View />);

    let sent: Promise<void> | undefined;
    act(() => {
      sent = api?.sendMessage("Hi");
    });
    await act(async () => {
      await seen;
    });
    expect(screen.getAllByTestId("message")).toHaveLength(2);

    await act(async () => {
      api?.stop();
      api?.setMessages([]);
      await sent;
    });

    expect(screen.queryAllByTestId("message")).toHaveLength(0);
    expect(api?.status).toBe("ready");
  });

  it("should stop on unmount and send nothing more under StrictMode", async () => {
    const { client, request, calls } = createMockedEndpoint([aiSDK(aiSDKTextAnswer(longAnswer))], { chunkTime: 2 });
    const { seen, onEvent } = onFirst("text-delta");
    const onFinish = vi.fn();
    const { result, unmount } = renderHook(() => useChat({ request, protocol: aiSDKProtocol(), onEvent, onFinish }), {
      wrapper: StrictMode,
    });
    const { chat } = result.current;

    let sent: Promise<void> | undefined;
    act(() => {
      sent = result.current.sendMessage("Hi");
    });
    await act(async () => {
      await seen;
    });
    const chunksAfterUnmount = vi.fn();
    unmount();
    client.requestManager.events.onResponseChunk(chunksAfterUnmount);
    await sent;

    expect(calls).toHaveLength(1);
    expect(chat.status).toBe("ready");
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ isAbort: true }));
    expect(chunksAfterUnmount).not.toHaveBeenCalled();
  });

  it("should keep the returned functions stable across renders", async () => {
    const { request } = createMockedEndpoint([aiSDK(aiSDKTextAnswer("x"))]);
    const { result, rerender } = renderHook(() => useChat({ request, protocol: aiSDKProtocol() }));
    const before = { ...result.current };

    rerender();
    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    (
      [
        "sendMessage",
        "regenerate",
        "resumeStream",
        "stop",
        "setMessages",
        "setState",
        "clearError",
        "addToolResult",
        "addToolApprovalResponse",
        "resolveInterrupt",
      ] as const
    ).forEach((name) => {
      expect(result.current[name]).toBe(before[name]);
    });
  });
});
