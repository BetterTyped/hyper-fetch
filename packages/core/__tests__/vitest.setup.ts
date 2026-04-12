/// <reference types="vitest/globals" />
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";
import { BroadcastChannel } from "node:worker_threads";
import * as matchers from "jest-extended";
import { expect } from "vitest";

expect.extend(matchers);

if (!globalThis.AbortController) {
  globalThis.AbortController = AbortController as any;
}

Object.defineProperties(globalThis, {
  BroadcastChannel: { value: BroadcastChannel },
});
