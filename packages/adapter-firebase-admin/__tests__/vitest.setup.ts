/// <reference types="vitest/globals" />
import { setImmediate } from "timers";
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";

globalThis.setImmediate = setImmediate;

if (!globalThis.AbortController) {
  globalThis.AbortController = AbortController as any;
}
