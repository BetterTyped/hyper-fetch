import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";

if (!global.AbortController) {
  global.AbortController = AbortController as any;
}
