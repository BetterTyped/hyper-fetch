import type { RequestInstance, ExtractAdapterExtraType, ExtractAdapterType, ExtractErrorType } from "@hyper-fetch/core";
import { scopeKey } from "@hyper-fetch/core";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import type { UseStreamOptionsType, UseStreamReturnType } from "./use-stream.types";

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
  // Every start() is a new run. Work of an older run (its response, its reader) must not touch the current state.
  const runRef = useRef(0);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

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

  /**
   * Ends the current run: the request is aborted when it is still in flight, and the body is canceled when it is
   * already being read - after `send()` resolved, aborting the request alone does not stop the stream.
   */
  const stopRun = () => {
    runRef.current += 1;
    abortRef.current?.();
    abortRef.current = null;
    readerRef.current?.cancel().catch(() => undefined);
    readerRef.current = null;
  };

  const consumeStream = async (stream: ReadableStream<Uint8Array>, run: number) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const isCurrentRun = () => runRef.current === run;

    if (!isCurrentRun()) {
      reader.cancel().catch(() => undefined);
      return;
    }
    readerRef.current = reader;

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (!isCurrentRun()) {
          return;
        }
        if (done) {
          break;
        }

        state.current.chunks = [...state.current.chunks, value];
        state.current.text += decoder.decode(value, { stream: true });
        emitChange();
      }

      readerRef.current = null;
      state.current.streaming = false;
      state.current.done = true;
      emitChange();
    } catch (error) {
      if (!isCurrentRun()) {
        return;
      }
      readerRef.current = null;
      state.current.streaming = false;
      state.current.error = error as ExtractErrorType<T>;
      emitChange();
    }
  };

  const start = useCallback(() => {
    if (state.current.streaming) {
      return;
    }

    stopRun();
    const run = runRef.current;

    state.current = {
      ...getInitialState<T>(),
      streaming: true,
    };
    emitChange();

    // `setOptions` replaces the adapter options - the ones of the request (timeout, credentials...) have to stay
    const streamingRequest = request.setOptions({ ...request.options, streaming: true } as any);

    streamingRequest.send().then((response) => {
      const { data, error, status, extra } = response;

      // Aborted, reset or restarted while waiting for the response
      if (runRef.current !== run) {
        if (data && typeof (data as any).getReader === "function") {
          (data as unknown as ReadableStream<Uint8Array>).cancel().catch(() => undefined);
        }
        return;
      }

      state.current.status = status as number | null;
      state.current.extra = extra as ExtractAdapterExtraType<ExtractAdapterType<T>> | null;

      if (error) {
        state.current.streaming = false;
        state.current.error = error;
        emitChange();
        return;
      }

      if (data && typeof (data as any).getReader === "function") {
        consumeStream(data as unknown as ReadableStream<Uint8Array>, run);
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
    stopRun();
    state.current.streaming = false;
    emitChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    stopRun();
    state.current = getInitialState<T>();
    startedRef.current = false;
    emitChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop reading the body when the component goes away. StrictMode unmounts and mounts again right away - that
  // must not stop the stream, so only an unmount that is still in place after the current task stops it.
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      queueMicrotask(() => {
        if (!mountedRef.current) {
          stopRun();
        }
      });
    };
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
