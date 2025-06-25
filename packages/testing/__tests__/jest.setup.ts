// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import EventSource from "eventsourcemock";

Object.defineProperty(window, "EventSource", {
  value: EventSource,
});

if (!global.AbortController) {
  global.AbortController = AbortController as any;
}
