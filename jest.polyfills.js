/**
 * @note The block below contains polyfills for Node.js globals
 * required for Jest to function when running JSDOM tests.
 * These HAVE to be require's and HAVE to be in this exact
 * order, since "undici" depends on the "TextEncoder" global API.
 *
 * Consider migrating to a more modern test runner if
 * you don't want to deal with this.
 */

if (typeof globalThis === "object") {
  const { TextDecoder, TextEncoder } = require("node:util");
  const { ReadableStream, TransformStream } = require("node:stream/web");

  Object.defineProperties(globalThis, {
    TextDecoder: { value: TextDecoder },
    TextEncoder: { value: TextEncoder },
    ReadableStream: { value: ReadableStream },
    TransformStream: { value: TransformStream },
  });

  const { Blob, File } = require("node:buffer");
  const { Headers, FormData, Request, Response } = require("undici");
  const { BroadcastChannel } = require("node:worker_threads");

  Object.defineProperties(globalThis, {
    Blob: { value: Blob },
    File: { value: File },
    Headers: { value: Headers },
    FormData: { value: FormData },
    Request: { value: Request, configurable: true },
    Response: { value: Response, configurable: true },
    BroadcastChannel: { value: BroadcastChannel },
  });
}
