/// <reference types="vitest/globals" />
// @ts-expect-error no types available for eventsourcemock
import EventSource from "eventsourcemock";
import * as matchers from "jest-extended";
import { expect } from "vitest";

expect.extend(matchers);

Object.defineProperty(window, "EventSource", {
  value: EventSource,
  writable: true,
});
