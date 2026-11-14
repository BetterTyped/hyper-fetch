import type { AISDKStreamChunkType } from "@hyper-fetch/ai";
import { encodeAISDKStream } from "@hyper-fetch/ai";
import { Client } from "@hyper-fetch/core";

export const fast = { requestTime: 0, responseTime: 0 };

export type CapturedRequestType = {
  payload: any;
  headers: Record<string, string> | undefined;
  endpoint: string;
  method: string;
};

/**
 * A chat endpoint mocked with HyperFetch's mocker. Every call takes the next response from `responses` and records
 * what the chat sent.
 */
export const createMockedEndpoint = (
  responses: ({ chunks: string[]; status?: number } | { error: unknown; status: number; chunks?: string[] })[],
  config: { chunkTime?: number } = {},
) => {
  const client = new Client({ url: "http://chat.test" });
  const calls: CapturedRequestType[] = [];
  const request = client
    .createRequest<{ response: any; payload: any; error: any }>()({ endpoint: "/api/chat", method: "POST" })
    .setMock(
      ({ request: sent }) => {
        calls.push({
          payload: sent.payload,
          headers: sent.headers as Record<string, string> | undefined,
          endpoint: sent.endpoint,
          method: sent.method,
        });
        const response = responses[Math.min(calls.length - 1, responses.length - 1)];
        if ("error" in response) {
          return {
            data: null,
            error: response.error,
            status: response.status,
            success: false,
            ...(response.chunks && { chunks: response.chunks }),
          };
        }
        return { chunks: response.chunks, status: response.status ?? 200 };
      },
      { ...fast, ...config },
    );
  return { client, request, calls };
};

export const aiSDK = (chunks: AISDKStreamChunkType[]) => ({ chunks: encodeAISDKStream(chunks) });
