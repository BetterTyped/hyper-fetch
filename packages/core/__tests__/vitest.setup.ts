/// <reference types="vitest/globals" />
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";
import * as matchers from "jest-extended";
import { BroadcastChannel } from "node:worker_threads";
import { expect } from "vitest";

expect.extend(matchers);

if (!globalThis.AbortController) {
  globalThis.AbortController = AbortController as any;
}

Object.defineProperties(globalThis, {
  BroadcastChannel: { value: BroadcastChannel },
});
