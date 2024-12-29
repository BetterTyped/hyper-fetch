import "jest-extended";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";
import { BroadcastChannel } from "node:worker_threads";

if (!global.AbortController) {
  global.AbortController = AbortController as any;
}

Object.defineProperties(globalThis, {
  BroadcastChannel: { value: BroadcastChannel },
});

jest.retryTimes(2);
