import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";
/// <reference types="vitest/globals" />
import { setImmediate } from "timers";

globalThis.setImmediate = setImmediate;

if (!globalThis.AbortController) {
  globalThis.AbortController = AbortController as any;
}
