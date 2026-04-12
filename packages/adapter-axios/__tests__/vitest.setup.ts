/// <reference types="vitest/globals" />
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";

if (!globalThis.AbortController) {
  globalThis.AbortController = AbortController as any;
}
