import { setImmediate } from "timers";
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";

global.setImmediate = setImmediate;

if (!global.AbortController) {
  global.AbortController = AbortController as any;
}
