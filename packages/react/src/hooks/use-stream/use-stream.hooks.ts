import {
  RequestInstance,
  ExtractAdapterExtraType,
  ExtractAdapterType,
  ExtractErrorType,
  scopeKey,
} from "@hyper-fetch/core";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { UseStreamOptionsType, UseStreamReturnType } from "./use-stream.types";

type StreamState<T extends RequestInstance> = {
  text: string;
  chunks: Uint8Array[];
  streaming: boolean;
  done: boolean;
  error: ExtractErrorType<T> | null;
  extra: ExtractAdapterExtraType<ExtractAdapterType<T>> | null;
  status: number | null;
};

const getInitialState = <T extends RequestInstance>(): StreamState<T> => ({
  text: "",
  chunks: [],
  streaming: false,
  done: false,
  error: null,
  extra: null,
  status: null,
});

/**
 * Hook for consuming streaming responses chunk-by-chunk.
 * Works with any request that uses the fetch adapter's `streaming: true` option.
 *
 * Provides both accumulated `text` (for LLM/SSE use cases) and raw `chunks`
 * (for binary streaming / file downloads).
 */
export const useStream = <T extends RequestInstance>(
  request: T,
  options?: UseStreamOptionsType,
): UseStreamReturnType<T> => {
  const { autoStart = false } = options || {};

  const state = useRef<StreamState<T>>(getInitialState<T>());
  const abortRef = useRef<(() => void) | null>(null);
  const startedRef = useRef(false);

  // useSyncExternalStore for re-renders
  const versionRef = useRef(0);
  const listenerRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback((listener: () => void) => {
    listenerRef.current = listener;
    return () => {
      listenerRef.current = null;
    };
  }, []);

  const getSnapshot = useCallback(() => versionRef.current, []);

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const emitChange = () => {
    versionRef.current += 1;
    listenerRef.current?.();
  };

  const consumeStream = async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) break;

        state.current.chunks = [...state.current.chunks, value];
        state.current.text += decoder.decode(value, { stream: true });
        emitChange();
      }

      state.current.streaming = false;
      state.current.done = true;
      emitChange();
    } catch (err) {
      state.current.streaming = false;
      state.current.error = err as ExtractErrorType<T>;
      emitChange();
    }
  };

  const start = useCallback(() => {
    if (state.current.streaming) return;

    state.current = {
      ...getInitialState<T>(),
      streaming: true,
    };
    emitChange();

    const streamingRequest = request.setOptions({ streaming: true } as any);

    streamingRequest.send().then((response) => {
      const { data, error, status, extra } = response;

      state.current.status = status as number | null;
      state.current.extra = extra as ExtractAdapterExtraType<ExtractAdapterType<T>> | null;

      if (error) {
        state.current.streaming = false;
        state.current.error = error;
        emitChange();
        return;
      }

      if (data && typeof (data as any).getReader === "function") {
        consumeStream(data as unknown as ReadableStream<Uint8Array>);
      } else {
        state.current.streaming = false;
        state.current.text = typeof data === "string" ? data : JSON.stringify(data);
        state.current.done = true;
        emitChange();
      }
    });

    abortRef.current = () => {
      request.client.requestManager.abortByKey(scopeKey(request.abortKey, request.scope));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const abort = useCallback(() => {
    abortRef.current?.();
    state.current.streaming = false;
    emitChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.();
    state.current = getInitialState<T>();
    startedRef.current = false;
    emitChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoStart && !startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, [autoStart, start]);

  return {
    text: state.current.text,
    chunks: state.current.chunks,
    streaming: state.current.streaming,
    done: state.current.done,
    error: state.current.error,
    extra: state.current.extra,
    status: state.current.status,
    start,
    abort,
    reset,
  };
};
