/* eslint-disable @typescript-eslint/no-namespace */
import EventSource from "eventsourcemock";

Object.defineProperty(window, "EventSource", {
  value: EventSource,
});

jest.retryTimes(2);
