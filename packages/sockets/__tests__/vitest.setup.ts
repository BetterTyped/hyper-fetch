/// <reference types="vitest/globals" />
import * as matchers from "jest-extended";
import { expect } from "vitest";

expect.extend(matchers);

const isNodeEnv = typeof window === "undefined";

/** Node's own `WebSocket` (Node.js 22+), before the setup replaces the global with `ws` */
export const nativeWebSocket: typeof WebSocket | undefined = globalThis.WebSocket;

if (isNodeEnv) {
  // E2E tests: real implementations on a browser-like `window`.
  // `e2e.environments.spec.ts` removes the window to cover Node.js apps.
  const { WebSocket: NodeWebSocket } = await import("ws");
  const { EventSource: NodeEventSource } = await import("eventsource");

  (globalThis as any).WebSocket = NodeWebSocket;
  (globalThis as any).EventSource = NodeEventSource;
  (globalThis as any).window = globalThis;
} else {
  // Unit tests: use mock EventSource for jsdom
  // @ts-expect-error no types available for eventsourcemock
  const EventSource = (await import("eventsourcemock")).default;
  Object.defineProperty(window, "EventSource", {
    value: EventSource,
    writable: true,
  });
}
