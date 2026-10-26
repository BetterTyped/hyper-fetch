/* eslint-disable @typescript-eslint/naming-convention */
import { useDidUpdate } from "@better-hooks/lifecycle";
import type {
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  RequestInstance,
  ExtractAdapterType,
  ExtractAdapterExtraType,
  ResponseType,
} from "@hyper-fetch/core";
import { replaceEqualDeep, scopeKey } from "@hyper-fetch/core";
import { useCallback, useRef, useSyncExternalStore } from "react";
import { isEqual } from "utils";

import type {
  UseTrackedStateActions,
  UseTrackedStateType,
  UseTrackedStateProps,
  UseTrackedStateReturn,
  UseTrackedStateResponseDetails,
} from "./use-tracked-state.types";
import {
  getInitialState,
  getIsInitiallyLoading,
  getShouldClearState,
  getValidCacheData,
  isStaleCacheData,
} from "./use-tracked-state.utils";

/**
 *
 * @param request
 * @param initialResponse
 * @param dispatcher
 * @param dependencies
 * @internal
 */
export const useTrackedState = <T extends RequestInstance, TData = ExtractResponseType<T>>({
  request,
  dispatcher,
  initialResponse,
  deepCompare,
  dependencyTracking,
  keepPreviousData = "auto",
  disabled,
  revalidate,
  select,
  structuralSharing = true,
}: UseTrackedStateProps<T, TData>): UseTrackedStateReturn<T, TData> => {
  const { client, cacheKey, queryKey, staleTime, unstable_responseMapper } = request;
  const { cache } = client;

  const state = useRef<UseTrackedStateType<T, TData>>(null as unknown as UseTrackedStateType<T, TData>);
  const renderKeys = useRef<(keyof UseTrackedStateType<T, TData>)[]>([]);
  const isProcessingData = useRef("");
  const previousCacheKey = useRef(cacheKey);

  // ******************
  // Data selection
  // ******************

  const selectRef = useRef(select);
  selectRef.current = select;
  const appliedSelect = useRef(select);
  // Response data before applying the selector - allows to re-run it when the selector changes
  const rawData = useRef<ExtractResponseType<T> | null>(null);
  // Data set with the setData action has the selected shape and should not get re-selected
  const isLocalData = useRef(false);
  const selectError = useRef<{ error: unknown } | null>(null);
  const responseDetails = useRef<UseTrackedStateResponseDetails | null>(null);

  const selectData = (data: ExtractResponseType<T> | null, previousData: TData | null = null): TData | null => {
    if (!selectRef.current || data === null || data === undefined) {
      return data as TData | null;
    }
    const selected = selectRef.current(data);
    return structuralSharing ? replaceEqualDeep(previousData, selected) : selected;
  };

  const getSelectedState = (newState: UseTrackedStateType<T>): UseTrackedStateType<T, TData> => {
    rawData.current = newState.data;
    isLocalData.current = false;
    responseDetails.current = null;
    appliedSelect.current = selectRef.current;
    return { ...newState, data: selectData(newState.data, state.current?.data) };
  };

  if (!state.current) {
    state.current = getSelectedState(getInitialState({ initialResponse, dispatcher, request, disabled }));
  }

  // Selector failed while processing incoming data - surface it to the closest error boundary
  if (selectError.current) {
    const { error } = selectError.current;
    selectError.current = null;
    throw error;
  }

  // Selector changed (e.g. it closes over a new prop) - re-run it against the latest response data
  if (appliedSelect.current !== select && !isLocalData.current) {
    appliedSelect.current = select;
    state.current.data = selectData(rawData.current, state.current.data);
  }

  // ******************
  // useSyncExternalStore
  // ******************

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

  // ******************
  // Utils
  // ******************

  const getStaleStatus = (): boolean => {
    const cacheData = cache.get(scopeKey(cacheKey, request.scope));
    return !cacheData || isStaleCacheData(staleTime, cacheData?.responseTimestamp);
  };

  // ******************
  // Dependency Tracking
  // ******************

  const renderKeyTrigger = (keys: (keyof UseTrackedStateType<T, TData>)[]) => {
    const shouldRerender = renderKeys.current.some((renderKey) => keys.includes(renderKey));
    if (shouldRerender) {emitChange();}
  };

  const setRenderKey = (renderKey: keyof UseTrackedStateType<T, TData>) => {
    if (!renderKeys.current.includes(renderKey)) {
      renderKeys.current.push(renderKey);
    }
  };

  // ******************
  // Cache initialization
  // ******************

  useDidUpdate(
    () => {
      const oldKey = previousCacheKey.current;
      previousCacheKey.current = cacheKey;

      // Get cache state
      const cacheData = cache.get<ExtractResponseType<T>, ExtractErrorType<T>>(cacheKey);
      const cacheState = getValidCacheData<T>(request, initialResponse, cacheData);

      // Determine whether to clear state based on keepPreviousData mode
      const shouldClear = getShouldClearState(keepPreviousData, oldKey, cacheKey);

      if (shouldClear && !cacheState) {
        // Reset state to initial values when no cached data exists for the new key
        const resetState = getInitialState({ initialResponse, dispatcher, request, disabled, revalidate });
        state.current = getSelectedState(resetState);
        renderKeyTrigger(Object.keys(state.current) as (keyof UseTrackedStateType<T, TData>)[]);
      } else if (cacheState) {
        state.current.loading = getIsInitiallyLoading({
          queryKey: scopeKey(request.queryKey, request.scope),
          dispatcher,
          disabled,
          revalidate,
          hasState: true,
        });
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        setCacheData(cacheState);
      }
      // When state is preserved and no cache exists (e.g. query param change in "auto" mode),
      // don't update loading on the ref — let the dispatcher's loading event handle it (#126)
    },
    [cacheKey, queryKey],
    true,
  );

  // ******************
  // Turn off dependency tracking
  // ******************

  useDidUpdate(
    () => {
      const handleDependencyTracking = () => {
        if (!dependencyTracking) {
          Object.keys(state.current).forEach((key) => setRenderKey(key as Parameters<typeof setRenderKey>[0]));
        }
      };

      handleDependencyTracking();
    },
    [dependencyTracking],
    true,
  );

  // ******************
  // Cache data handler
  // ******************

  const handleCompare = (firstValue: unknown, secondValue: unknown) => {
    if (Object.is(firstValue, secondValue)) {
      return true;
    }
    if (typeof deepCompare === "function") {
      return deepCompare(firstValue, secondValue);
    }
    if (deepCompare) {
      return isEqual(firstValue, secondValue);
    }
    return false;
  };

  const handleCacheData = (
    cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
  ) => {
    rawData.current = cacheData.data;
    isLocalData.current = false;
    appliedSelect.current = selectRef.current;
    responseDetails.current = {
      willRetry: !!cacheData.willRetry,
      isCanceled: !!cacheData.isCanceled,
      isOffline: !!cacheData.isOffline,
    };

    let data: TData | null;
    try {
      data = selectData(cacheData.data, state.current.data);
    } catch (error) {
      // Never throw inside of the cache events - rethrow it on render instead
      selectError.current = { error };
      emitChange();
      return;
    }

    const newStateValues: UseTrackedStateType<T, TData> = {
      data,
      error: cacheData.error,
      status: cacheData.status,
      success: cacheData.success,
      extra: cacheData.extra as ExtractAdapterExtraType<ExtractAdapterType<T>>,
      retries: cacheData.retries,
      responseTimestamp: new Date(cacheData.responseTimestamp),
      requestTimestamp: new Date(cacheData.requestTimestamp),
      loading: dispatcher.hasRunningRequests(queryKey),
    };

    const nextState: UseTrackedStateType<T, TData> = { ...state.current };
    const changedKeys = (Object.keys(newStateValues) as (keyof UseTrackedStateType<T, TData>)[]).filter((key) => {
      const isEqualValue = handleCompare(state.current[key], newStateValues[key]);
      // Equal values keep their previous reference, so they stay stable between renders
      if (!isEqualValue) {
        (nextState as Record<string, unknown>)[key] = newStateValues[key];
      }
      return !isEqualValue;
    });

    state.current = nextState;

    renderKeyTrigger(changedKeys);
  };

  const setIsDataProcessing = ({
    processingCacheKey,
    isProcessing,
  }: {
    processingCacheKey: string;
    isProcessing: boolean;
  }) => {
    if (isProcessing) {
      isProcessingData.current = processingCacheKey;
    }
    // Do not turn off other keys processing
    else if (isProcessingData.current === cacheKey) {
      isProcessingData.current = "";
    }
  };

  const getIsDataProcessing = (processingCacheKey: string) => {
    return isProcessingData.current === processingCacheKey;
  };

  const setCacheData = (
    cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
  ): Promise<void> | void => {
    setIsDataProcessing({ processingCacheKey: cacheKey, isProcessing: true });
    const data = unstable_responseMapper
      ? unstable_responseMapper(cacheData as ResponseType<any, any, ExtractAdapterType<T>>)
      : cacheData;

    if (data instanceof Promise) {
      return (async () => {
        const promiseData = await data;
        handleCacheData({ ...cacheData, ...promiseData } as CacheValueType<
          ExtractResponseType<T>,
          ExtractErrorType<T>,
          ExtractAdapterType<T>
        >);
        setIsDataProcessing({ processingCacheKey: cacheKey, isProcessing: false });
      })();
    }
    setIsDataProcessing({ processingCacheKey: cacheKey, isProcessing: false });
    return handleCacheData({ ...cacheData, ...data } as CacheValueType<
      ExtractResponseType<T>,
      ExtractErrorType<T>,
      ExtractAdapterType<T>
    >);
  };

  // ******************
  // Actions
  // ******************

  const actions: UseTrackedStateActions<T, TData> = {
    setData: (data) => {
      isLocalData.current = true;
      state.current.data = data instanceof Function ? data(state.current.data || null) : data;
      renderKeyTrigger(["data"]);
    },
    setError: (error) => {
      state.current.error = error instanceof Function ? error(state.current.error || null) : error;
      renderKeyTrigger(["error"]);
    },
    setLoading: (loading) => {
      const value = loading instanceof Function ? loading(state.current.loading) : loading;
      if (value === state.current.loading) {return;}
      state.current.loading = value;
      renderKeyTrigger(["loading"]);
    },
    setStatus: (status) => {
      const value = status instanceof Function ? status(state.current.status) : status;
      if (value === state.current.status) {return;}
      state.current.status = status instanceof Function ? status(state.current.status || null) : status;
      renderKeyTrigger(["status"]);
    },
    setSuccess: (success) => {
      const value = success instanceof Function ? success(state.current.success || false) : success;
      if (value === state.current.success) {return;}
      state.current.success = success instanceof Function ? success(state.current.success || false) : success;
      renderKeyTrigger(["success"]);
    },
    setExtra: (extra) => {
      const value = extra instanceof Function ? extra(state.current.extra) : extra;
      if (value === state.current.extra) {return;}
      state.current.extra = extra instanceof Function ? extra(state.current.extra) : extra;
      renderKeyTrigger(["extra"]);
    },
    setRetries: (retries) => {
      const value = retries instanceof Function ? retries(state.current.retries || 0) : retries;
      if (value === state.current.retries) {return;}
      state.current.retries = retries instanceof Function ? retries(state.current.retries || 0) : retries;
      renderKeyTrigger(["retries"]);
    },
    setResponseTimestamp: (timestamp) => {
      const value = timestamp instanceof Function ? timestamp(state.current.responseTimestamp) : timestamp;
      if (value === state.current.responseTimestamp) {return;}
      const getTimestamp = (prev: Date | null) => {
        return timestamp instanceof Function ? timestamp(prev ? new Date(prev) : null) : timestamp;
      };

      state.current.responseTimestamp = getTimestamp(state.current.responseTimestamp);
      renderKeyTrigger(["responseTimestamp"]);
    },
    setRequestTimestamp: (timestamp) => {
      const value = timestamp instanceof Function ? timestamp(state.current.requestTimestamp) : timestamp;
      if (value === state.current.requestTimestamp) {return;}
      const getTimestamp = (prev: Date | null) => {
        return timestamp instanceof Function ? timestamp(prev ? new Date(prev) : null) : timestamp;
      };

      state.current.requestTimestamp = getTimestamp(state.current.requestTimestamp);
      renderKeyTrigger(["requestTimestamp"]);
    },
    clearState: () => {
      rawData.current = null;
      isLocalData.current = false;
      responseDetails.current = null;
      state.current = {
        data: null,
        error: null,
        loading: false,
        status: null,
        success: false,
        extra: null,
        retries: 0,
        responseTimestamp: null,
        requestTimestamp: null,
      } as UseTrackedStateType<T, TData>;
      renderKeyTrigger(Object.keys(state.current) as (keyof UseTrackedStateType<T, TData>)[]);
    },
  };

  return [
    state.current,
    actions,
    {
      setRenderKey,
      setCacheData,
      getStaleStatus,
      getIsDataProcessing,
      selectData: (data) => selectData(data, state.current.data),
      getResponseDetails: () => responseDetails.current,
    },
  ];
};
