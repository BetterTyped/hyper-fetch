/* eslint-disable @typescript-eslint/no-namespace */
import EventSource from "eventsourcemock";

Object.defineProperty(window, "EventSource", {
  value: EventSource,
  writable: true,
});
