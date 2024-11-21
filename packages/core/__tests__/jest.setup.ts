import "jest-extended";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill";

if (!global.AbortController) {
  global.AbortController = AbortController as any;
}

jest.retryTimes(2);
