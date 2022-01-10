import EventEmitter from "events";

import { getFetchEvents } from "builder";

// Events
export const getAbortEventKey = (key: string) => `${key}-request-abort`;
export const getRequestStartEventKey = (key: string) => `${key}-request-start`;
export const getResponseStartEventKey = (key: string) => `${key}-response-start`;
export const getUploadProgressEventKey = (key: string) => `${key}-request-progress`;
export const getDownloadProgressEventKey = (key: string) => `${key}-response-progress`;

// Command Manager

export class CommandManager {
  emitter = new EventEmitter();
  events = getFetchEvents(this.emitter);

  abortControllers = new Map<string, AbortController>();
}
