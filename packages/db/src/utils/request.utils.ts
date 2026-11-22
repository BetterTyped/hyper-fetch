import type { RequestInstance } from "@hyper-fetch/core";
import type { ListenerInstance } from "@hyper-fetch/sockets";

import type { AnyRequestPatch, ListenerPatch } from "../collection/collection.types";

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
};

/** Objects merge and arrays, such as Firestore constraints, add up. Anything else replaces the current value. */
const mergeValue = (current: unknown, next: unknown) => {
  if (isPlainObject(current) && isPlainObject(next)) {
    return { ...current, ...next };
  }
  if (Array.isArray(current) && Array.isArray(next)) {
    return [...current, ...next];
  }
  return next;
};

/** Applies patches to a request, merging params, query params and object payloads into what it already has */
export const applyRequestPatches = <Req extends RequestInstance>(
  request: Req,
  patches: readonly AnyRequestPatch[],
): Req => {
  let next: RequestInstance = request;
  patches.forEach((patch) => {
    if (patch.params) {
      next = next.setParams({ ...(next.params as Record<string, unknown> | undefined), ...patch.params } as never);
    }
    if (patch.queryParams !== undefined) {
      next = next.setQueryParams(mergeValue(next.queryParams, patch.queryParams) as never);
    }
    if ("payload" in patch) {
      next = next.setPayload(mergeValue(next.payload, patch.payload));
    }
  });
  return next as Req;
};

/** Applies patches to a listener, merging topic params, payloads and query params into what it already has */
export const applyListenerPatches = (listener: ListenerInstance, patches: readonly ListenerPatch[]) => {
  let next = listener;
  patches.forEach((patch) => {
    if (patch.params) {
      next = next.setParams({ ...next.params, ...patch.params } as never);
    }
    if ("payload" in patch) {
      next = next.setPayload(mergeValue(next.payload, patch.payload));
    }
    if (patch.queryParams !== undefined) {
      next = next.setQueryParams(mergeValue(next.queryParams, patch.queryParams) as never);
    }
  });
  return next;
};

let idCounter = 0;

/** A unique id for transactions and temporary keys */
export const createId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2)}`;
};
