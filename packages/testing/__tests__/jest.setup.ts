import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";
import EventSource from "eventsourcemock";

Object.defineProperty(window, "EventSource", {
  value: EventSource,
});

if (!global.AbortController) {
  global.AbortController = AbortController as any;
}
