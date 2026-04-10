/* eslint-disable @typescript-eslint/no-namespace */
// @ts-expect-error no types available for eventsourcemock
import EventSource from "eventsourcemock";

Object.defineProperty(window, "EventSource", {
  value: EventSource,
  writable: true,
});
