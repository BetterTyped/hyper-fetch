import type { RequestEventType, RequestProgressEventType, RequestResponseEventType } from "managers";

import type { RequestInstance } from "./request.types";

type HookName =
  | "onBeforeSent"
  | "onRequestStart"
  | "onResponseStart"
  | "onUploadProgress"
  | "onDownloadProgress"
  | "onResponse"
  | "onRemove";

export interface RequestHooks<R extends RequestInstance> {
  onBeforeSent: (cb: (eventData: RequestEventType<R>) => void) => () => void;
  onRequestStart: (cb: (eventData: RequestEventType<R>) => void) => () => void;
  onResponseStart: (cb: (eventData: RequestEventType<R>) => void) => () => void;
  onUploadProgress: (cb: (eventData: RequestProgressEventType<R>) => void) => () => void;
  onDownloadProgress: (cb: (eventData: RequestProgressEventType<R>) => void) => () => void;
  onResponse: (cb: (eventData: RequestResponseEventType<R>) => void) => () => void;
  onRemove: (cb: (eventData: RequestEventType<R>) => void) => () => void;
  /** @internal Invoke all registered listeners for a given hook */
  __emit: (name: HookName, data: any) => void;
  /** @internal Get a snapshot of all registered listeners (used by clone) */
  __snapshot: () => Record<HookName, ((...args: any[]) => void)[]>;
}

const HOOK_NAMES: HookName[] = [
  "onBeforeSent",
  "onRequestStart",
  "onResponseStart",
  "onUploadProgress",
  "onDownloadProgress",
  "onResponse",
  "onRemove",
];

export function createRequestHooks<R extends RequestInstance>(
  initial?: Record<HookName, ((...args: any[]) => void)[]>,
): RequestHooks<R> {
  const listeners: Record<HookName, ((...args: any[]) => void)[]> = {
    onBeforeSent: [],
    onRequestStart: [],
    onResponseStart: [],
    onUploadProgress: [],
    onDownloadProgress: [],
    onResponse: [],
    onRemove: [],
  };

  if (initial) {
    HOOK_NAMES.forEach((name) => {
      listeners[name] = [...initial[name]];
    });
  }

  const subscribe = (name: HookName) => {
    return (cb: (...args: any[]) => void) => {
      listeners[name].push(cb);
      return () => {
        const idx = listeners[name].indexOf(cb);
        if (idx !== -1) {listeners[name].splice(idx, 1);}
      };
    };
  };

  return {
    onBeforeSent: subscribe("onBeforeSent"),
    onRequestStart: subscribe("onRequestStart"),
    onResponseStart: subscribe("onResponseStart"),
    onUploadProgress: subscribe("onUploadProgress"),
    onDownloadProgress: subscribe("onDownloadProgress"),
    onResponse: subscribe("onResponse"),
    onRemove: subscribe("onRemove"),
    __emit(name: HookName, data: any) {
      listeners[name].forEach((cb) => {
        cb(data);
      });
    },
    __snapshot() {
      const snap = {} as Record<HookName, ((...args: any[]) => void)[]>;
      HOOK_NAMES.forEach((name) => {
        snap[name] = [...listeners[name]];
      });
      return snap;
    },
  };
}
