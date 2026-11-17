import type {
  RequestInstance,
  ExtractAdapterExtraType,
  ExtractAdapterType,
  ExtractErrorType,
  ExtractResponseType,
  StreamParserType,
} from "@hyper-fetch/core";
import { createNDJSONParser, createSSEParser, getRequestDispatcher, scopeKey } from "@hyper-fetch/core";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import type {
  UseStreamEventType,
  UseStreamFormatType,
  UseStreamOptionsType,
  UseStreamReturnType,
} from "./use-stream.types";

type StreamState<T extends RequestInstance, Event> = {
  text: string;
  chunks: Uint8Array[];
  events: Event[];
  data: ExtractResponseType<T> | null;
  streaming: boolean;
  done: boolean;
  aborted: boolean;
  error: ExtractErrorType<T> | null;
  extra: ExtractAdapterExtraType<ExtractAdapterType<T>> | null;
  status: number | null;
};

/**
 * Stop one sent request, whatever it is doing. A running request is aborted, which closes its connection.
 * A request that waits - for a retry, for the network to come back or for its turn in a queue - has nothing to
 * abort, so it is removed from the dispatcher to make sure it is never sent later.
 */
const cancelRequest = (request: RequestInstance, requestId: string) => {
  const [dispatcher] = getRequestDispatcher(request);
  const queryKey = scopeKey(request.queryKey, request.scope);
  const abortKey = scopeKey(request.abortKey, request.scope);

  if (dispatcher.hasRunningRequest(queryKey, requestId)) {
    request.client.requestManager.abortByRequestId(abortKey, requestId);
  } else {
    dispatcher.delete(queryKey, requestId, abortKey);
  }
};

const getInitialState = <T extends RequestInstance, Event>(): StreamState<T, Event> => ({
  text: "",
  chunks: [],
  events: [],
  data: null,
  streaming: false,
  done: false,
  aborted: false,
  error: null,
  extra: null,
  status: null,
});

/**
 * Hook for consuming streaming responses chunk-by-chunk.
 * Works with any request whose adapter supports the `streaming: true` option (e.g. the default fetch adapter).
 *
 * Provides accumulated `text` (for LLM/SSE use cases), raw `chunks` (for binary streaming / file downloads) and,
 * with the `format` option, parsed SSE or NDJSON `events`.
 */
export const useStream = <
  T extends RequestInstance,
  Format extends UseStreamFormatType = "text",
  NDJSONValue = unknown,
>(
  request: T,
  options?: UseStreamOptionsType<Format, NDJSONValue>,
): UseStreamReturnType<T, Format, NDJSONValue> => {
  type Event = UseStreamEventType<Format, NDJSONValue>;
  const { autoStart = false } = options || {};

  const optionsRef = useRef(options);
  optionsRef.current = options;
  // Requests are often created during render (`useStream(request.setParams(...))`), so their identity can't
  // drive the callbacks or effects - a running stream has to survive re-renders. `start()` uses the latest one.
  const requestRef = useRef(request);
  requestRef.current = request;

  const state = useRef<StreamState<T, Event>>(getInitialState<T, Event>());
  const startedRef = useRef(false);
  // Every start/reset begins a new session; callbacks from older sessions are ignored
  const sessionRef = useRef(0);
  const activeRef = useRef<{ session: number; requestId: string | null; request: RequestInstance } | null>(null);

  const versionRef = useRef(0);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback(() => versionRef.current, []);

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const emitChange = useCallback(() => {
    versionRef.current += 1;
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const abortActive = useCallback(() => {
    const active = activeRef.current;
    activeRef.current = null;
    if (active?.requestId) {
      cancelRequest(active.request, active.requestId);
    }
  }, []);

  const start = useCallback(() => {
    if (state.current.streaming) {
      return;
    }

    sessionRef.current += 1;
    const session = sessionRef.current;
    const isCurrent = () => sessionRef.current === session;

    state.current = { ...getInitialState<T, Event>(), streaming: true };
    emitChange();

    const format = optionsRef.current?.format ?? "text";
    const onParsedEvent = (event: Event) => {
      state.current.events.push(event);
      optionsRef.current?.onEvent?.(event);
    };
    let parser: StreamParserType | null = null;
    if (format === "sse") {
      parser = createSSEParser({ onEvent: (event) => onParsedEvent(event as Event) });
    } else if (format === "ndjson") {
      parser = createNDJSONParser({ onValue: (value) => onParsedEvent(value as Event) });
    }

    const latestRequest = requestRef.current;
    // Every stream needs a request of its own: joining a running (deduplicated) request would miss the chunks
    // that were already delivered, and would share the fate of a stream another hook or mount has aborted.
    const streamingRequest = latestRequest
      .setOptions({ ...latestRequest.options, streaming: true })
      .setDeduplicate(false);
    activeRef.current = { session, requestId: null, request: streamingRequest };

    // Set when the hook itself ended the stream (parse error) - the request's later abort result is ignored
    let settled = false;
    const finishWithError = (error: unknown) => {
      state.current.streaming = false;
      state.current.error = error as ExtractErrorType<T>;
      emitChange();
    };

    streamingRequest
      .send({
        onBeforeSent: ({ requestId }) => {
          if (activeRef.current?.session === session) {
            activeRef.current.requestId = requestId;
          } else {
            // Aborted or reset before the request was even queued
            cancelRequest(streamingRequest, requestId);
          }
        },
        onRequestStart: () => {
          // A retried request streams again from the beginning
          if (!isCurrent() || settled || state.current.chunks.length === 0) {
            return;
          }
          state.current.text = "";
          state.current.chunks.length = 0;
          state.current.events.length = 0;
          parser?.reset();
          emitChange();
        },
        onResponseChunk: ({ chunk, text, index }) => {
          if (!isCurrent() || settled || state.current.aborted) {
            return;
          }
          state.current.chunks.push(chunk);
          state.current.text += text;
          optionsRef.current?.onChunk?.({ chunk, text, index });
          try {
            parser?.feed(text);
          } catch (error) {
            settled = true;
            finishWithError(error);
            abortActive();
            return;
          }
          emitChange();
        },
      } as Parameters<T["send"]>[0])
      .then((response) => {
        if (!isCurrent() || settled) {
          return;
        }
        if (activeRef.current?.session === session) {
          activeRef.current = null;
        }

        const { data, error, status, extra } = response;
        state.current.status = status as number | null;
        state.current.extra = extra as ExtractAdapterExtraType<ExtractAdapterType<T>> | null;

        if (state.current.aborted) {
          state.current.streaming = false;
          emitChange();
          return;
        }

        if (error) {
          finishWithError(error);
          return;
        }

        try {
          parser?.flush();
        } catch (parseError) {
          finishWithError(parseError);
          return;
        }

        // Adapters that don't emit chunks still resolve with the whole body
        if (state.current.chunks.length === 0 && data !== null && data !== undefined) {
          state.current.text = typeof data === "string" ? data : JSON.stringify(data);
        }

        state.current.data = data as ExtractResponseType<T>;
        state.current.streaming = false;
        state.current.done = true;
        emitChange();
      });
  }, [emitChange, abortActive]);

  const abort = useCallback(() => {
    if (!state.current.streaming) {
      return;
    }
    state.current.aborted = true;
    state.current.streaming = false;
    abortActive();
    emitChange();
  }, [abortActive, emitChange]);

  const reset = useCallback(() => {
    sessionRef.current += 1;
    abortActive();
    state.current = getInitialState<T, Event>();
    startedRef.current = false;
    emitChange();
  }, [abortActive, emitChange]);

  useEffect(() => {
    if (autoStart && !startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, [autoStart, start]);

  // Close the connection when the component unmounts. Under StrictMode the effects re-run right after,
  // so leave the state ready for autoStart to start a fresh stream.
  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      abortActive();
      startedRef.current = false;
      state.current.streaming = false;
    };
  }, [abortActive]);

  return {
    text: state.current.text,
    chunks: state.current.chunks,
    events: state.current.events,
    data: state.current.data,
    streaming: state.current.streaming,
    done: state.current.done,
    aborted: state.current.aborted,
    error: state.current.error,
    extra: state.current.extra,
    status: state.current.status,
    start,
    abort,
    reset,
  };
};
