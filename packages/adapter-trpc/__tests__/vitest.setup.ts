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

/**
 * Node.js 22 (the CI runtime) has no global `CloseEvent` - it came in Node.js 23. The controlled WebSocket of the
 * tests dispatches close events with it, the same way the browser and newer Node.js versions do.
 */
if (globalThis.CloseEvent === undefined) {
  class TestCloseEvent extends Event {
    readonly code: number;
    readonly reason: string;
    readonly wasClean: boolean;

    constructor(type: string, init: CloseEventInit = {}) {
      super(type, init);
      this.code = init.code ?? 0;
      this.reason = init.reason ?? "";
      this.wasClean = init.wasClean ?? false;
    }
  }
  globalThis.CloseEvent = TestCloseEvent as typeof globalThis.CloseEvent;
}
