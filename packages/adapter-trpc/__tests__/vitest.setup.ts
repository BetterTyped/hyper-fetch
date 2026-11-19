/// <reference types="vitest/globals" />
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";
import { EventSource } from "eventsource";
import * as matchers from "jest-extended";
import { expect } from "vitest";

expect.extend(matchers);

if (!globalThis.AbortController) {
  globalThis.AbortController = AbortController as any;
}

// Node has a global WebSocket, but not EventSource - the SSE adapter needs the real one in e2e tests
if (!globalThis.EventSource) {
  globalThis.EventSource = EventSource as typeof globalThis.EventSource;
}
