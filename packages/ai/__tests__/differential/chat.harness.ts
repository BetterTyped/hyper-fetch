import type { ChatOptionsType, ChatProtocolType, ChatTypes } from "@hyper-fetch/ai";
import { Chat } from "@hyper-fetch/ai";
import type { RequestInstance } from "@hyper-fetch/core";
import { Client } from "@hyper-fetch/core";

export type HarnessCallType = { payload: any; headers: Record<string, string> | undefined };

/**
 * Our `Chat` in front of a backend function: every request is answered with the wire text `respond` returns for the
 * request body, streamed in `pieces` (one piece by default). No network and no timers beyond HyperFetch's mocker.
 */
export const createHarnessChat = <T extends ChatTypes = ChatTypes>({
  protocol,
  respond,
  pieces = (wire) => [wire],
  ...options
}: {
  protocol: ChatProtocolType;
  respond: (payload: any, call: number) => string | Promise<string>;
  pieces?: (wire: string) => string[];
} & Partial<Omit<ChatOptionsType<T, RequestInstance>, "request" | "protocol">>) => {
  const calls: HarnessCallType[] = [];
  const request = new Client({ url: "http://differential.test" })
    .createRequest<{ response: any; payload: any; error: any }>()({ endpoint: "/api/chat", method: "POST" })
    .setMock(
      async ({ request: sent }) => {
        const call: HarnessCallType = {
          payload: structuredClone(sent.payload),
          headers: sent.headers as Record<string, string> | undefined,
        };
        calls.push(call);
        const wire = await respond(call.payload, calls.length - 1);
        return { chunks: pieces(wire), status: 200 };
      },
      { requestTime: 0, responseTime: 0 },
    );
  const chat = new Chat<T>({ request, protocol, ...options } as ChatOptionsType<T, RequestInstance>);
  return { chat, calls };
};
