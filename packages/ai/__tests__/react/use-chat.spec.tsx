import type { ChatMessageType } from "@hyper-fetch/ai";
import { aiSDKProtocol, aiSDKTextAnswer, Chat, encodeAISDKStream } from "@hyper-fetch/ai";
import { useChat } from "@hyper-fetch/ai/react";
import { Client } from "@hyper-fetch/core";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { memo, StrictMode } from "react";

const fast = { requestTime: 0, responseTime: 0 };

const createRequest = (chunks: string[][], config: { chunkTime?: number } = {}) => {
  const client = new Client({ url: "http://react-chat.test" });
  let call = 0;
  return client
    .createRequest<{ response: string; payload: unknown }>()({ endpoint: "/api/chat", method: "POST" })
    .setMock(
      () => {
        const response = chunks[Math.min(call, chunks.length - 1)];
        call += 1;
        return { chunks: response, status: 200 };
      },
      { ...fast, ...config },
    );
};

type Types = { tools: { getTime: { input: { zone: string }; output: string } } };

describe("useChat", () => {
  it("should send a message and render the streamed answer", async () => {
    const request = createRequest([encodeAISDKStream(aiSDKTextAnswer("Hello from React"))]);
    const { result } = renderHook(() => useChat({ request, protocol: aiSDKProtocol() }));

    expect(result.current.status).toBe("ready");
    expect(result.current.messages).toEqual([]);

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].parts.find((part) => part.type === "text")).toMatchObject({
      text: "Hello from React",
    });
  });

  it("should keep the same chat across renders and use the latest callbacks", async () => {
    const request = createRequest([encodeAISDKStream(aiSDKTextAnswer("x"))]);
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ onFinish }) => useChat({ request, protocol: aiSDKProtocol(), onFinish }),
      {
        initialProps: { onFinish: first },
      },
    );
    const { chat } = result.current;

    rerender({ onFinish: second });
    expect(result.current.chat).toBe(chat);

    await act(async () => {
      await result.current.sendMessage("Hi");
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("should create a new chat when the id changes", () => {
    const request = createRequest([encodeAISDKStream([])]);
    const { result, rerender } = renderHook(({ id }) => useChat({ id, request, protocol: aiSDKProtocol() }), {
      initialProps: { id: "a" },
    });
    const { chat } = result.current;
    rerender({ id: "b" });
    expect(result.current.chat).not.toBe(chat);
    expect(result.current.id).toBe("b");
  });

  it("should share an external chat between components", async () => {
    const request = createRequest([encodeAISDKStream(aiSDKTextAnswer("shared"))]);
    const chat = new Chat({ request, protocol: aiSDKProtocol() });
    const first = renderHook(() => useChat({ chat, request, protocol: aiSDKProtocol() }));
    const second = renderHook(() => useChat({ chat, request, protocol: aiSDKProtocol() }));

    await act(async () => {
      await first.result.current.sendMessage("Hi");
    });

    expect(second.result.current.messages).toHaveLength(2);
    first.unmount();
    expect(chat.messages).toHaveLength(2);
  });

  it("should stop streaming when the owning component unmounts", async () => {
    const request = createRequest([encodeAISDKStream(aiSDKTextAnswer("a b c d e f g"))], { chunkTime: 10 });
    const onFinish = vi.fn();
    const { result, unmount } = renderHook(() => useChat({ request, protocol: aiSDKProtocol(), onFinish }));

    act(() => {
      result.current.sendMessage("go");
    });
    await waitFor(() => expect(result.current.status).toBe("streaming"));
    unmount();

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ isAbort: true })));
  });

  it("should throttle re-renders while streaming", async () => {
    const words = Array.from({ length: 30 }, (_, index) => `w${index}`).join(" ");
    const request = createRequest([encodeAISDKStream(aiSDKTextAnswer(words))], { chunkTime: 1 });
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useChat({ request, protocol: aiSDKProtocol(), throttleMs: 50 });
    });

    await act(async () => {
      await result.current.sendMessage("go");
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.messages[1].parts.find((part) => part.type === "text")).toMatchObject({ text: words });
    // 30+ events but far fewer renders
    expect(renders).toBeLessThan(25);
  });

  it("should resume a stream on mount", async () => {
    const request = createRequest([encodeAISDKStream([])]);
    const resumeRequest = createRequest([encodeAISDKStream(aiSDKTextAnswer("resumed"))]);
    const { result } = renderHook(() => useChat({ request, resumeRequest, protocol: aiSDKProtocol(), resume: true }));

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0].parts.find((part) => part.type === "text")).toMatchObject({ text: "resumed" });
  });

  it("should work under StrictMode", async () => {
    const request = createRequest([encodeAISDKStream(aiSDKTextAnswer("strict"))]);
    const { result } = renderHook(() => useChat({ request, protocol: aiSDKProtocol() }), { wrapper: StrictMode });

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.messages[1].parts.find((part) => part.type === "text")).toMatchObject({ text: "strict" });
  });

  it("should not re-render untouched messages while another message streams", async () => {
    const request = createRequest([encodeAISDKStream(aiSDKTextAnswer("one two three four"))], { chunkTime: 1 });
    const messageRenders = new Map<string, number>();
    const Message = memo(({ message }: { message: ChatMessageType }) => {
      messageRenders.set(message.id, (messageRenders.get(message.id) ?? 0) + 1);
      return <p>{message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}</p>;
    });
    let send: (text: string) => Promise<void> = async () => {};
    const App = () => {
      const { messages, sendMessage } = useChat({ request, protocol: aiSDKProtocol() });
      send = sendMessage;
      return (
        <div>
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </div>
      );
    };
    render(<App />);

    await act(async () => {
      await send("first question");
    });
    await screen.findByText("one two three four");

    const userId = [...messageRenders.keys()][0];
    expect(messageRenders.get(userId)).toBe(1);
  });

  it("should type tool results", () => {
    const request = createRequest([encodeAISDKStream([])]);
    const { result } = renderHook(() => useChat<Types>({ request, protocol: aiSDKProtocol() }));
    const check = () => {
      result.current.addToolResult({ tool: "getTime", toolCallId: "1", output: "12:00" });
      // @ts-expect-error - output must be a string
      result.current.addToolResult({ tool: "getTime", toolCallId: "1", output: 12 });
    };
    expect(check).toBeTypeOf("function");
  });
});
