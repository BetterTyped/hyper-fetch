/// <reference types="vitest/globals" />
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";
import EventSource from "eventsourcemock";

Object.defineProperty(window, "EventSource", {
  value: EventSource,
});

if (!globalThis.AbortController) {
  globalThis.AbortController = AbortController as any;
}
