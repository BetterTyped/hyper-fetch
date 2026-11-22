/// <reference types="vitest/globals" />
import * as matchers from "jest-extended";
import { expect } from "vitest";

expect.extend(matchers);

if (typeof window === "undefined") {
  // E2E specs run in node, where sockets need a real WebSocket implementation
  const { WebSocket: NodeWebSocket } = await import("ws");
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = NodeWebSocket;
}
