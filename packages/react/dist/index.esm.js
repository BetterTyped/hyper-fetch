var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/use-fetch/use-fetch.hooks.ts
import { useRef as useRef4 } from "react";
import { useDidUpdate as useDidUpdate4, useDidMount } from "@better-typed/react-lifecycle-hooks";
import { Command, getCommandKey } from "@better-typed/hyper-fetch";

// src/helpers/use-command-events/use-command-events.hooks.ts
import { useRef } from "react";
import {
  isFailedRequest
} from "@better-typed/hyper-fetch";
import { useDidUpdate, useIsMounted, useWillUnmount } from "@better-typed/react-lifecycle-hooks";
var useCommandEvents = ({
  command,
  dispatcher,
  logger,
  state,
  actions,
  setCacheData,
  initializeCallbacks = false
}) => {
  const { cache, appManager, commandManager } = command.builder;
  const commandDump = command.dump();
  const isMounted = useIsMounted();
  const onRequestCallback = useRef(null);
  const onSuccessCallback = useRef(null);
  const onErrorCallback = useRef(null);
  const onAbortCallback = useRef(null);
  const onOfflineErrorCallback = useRef(null);
  const onFinishedCallback = useRef(null);
  const onRequestStartCallback = useRef(null);
  const onResponseStartCallback = useRef(null);
  const onDownloadProgressCallback = useRef(null);
  const onUploadProgressCallback = useRef(null);
  const lifecycleEvents = useRef(/* @__PURE__ */ new Map());
  const dataEvents = useRef(null);
  const handleResponseCallbacks = (data, details) => {
    var _a, _b, _c, _d, _e;
    if (!isMounted)
      return logger.debug("Callback cancelled, component is unmounted");
    const { isOffline, isFailed, isCanceled } = details;
    if (command.offline && isOffline && isFailed) {
      logger.debug("Performing offline error callback", { data, details });
      (_a = onOfflineErrorCallback.current) == null ? void 0 : _a.call(onOfflineErrorCallback, data[1], details);
    } else if (isCanceled) {
      logger.debug("Performing abort callback", { data, details });
      (_b = onAbortCallback.current) == null ? void 0 : _b.call(onAbortCallback, data[1], details);
    } else if (!isFailed) {
      logger.debug("Performing success callback", { data, details });
      (_c = onSuccessCallback.current) == null ? void 0 : _c.call(onSuccessCallback, data[0], details);
    } else {
      logger.debug("Performing error callback", { data, details });
      (_d = onErrorCallback.current) == null ? void 0 : _d.call(onErrorCallback, data[1], details);
    }
    (_e = onFinishedCallback.current) == null ? void 0 : _e.call(onFinishedCallback, data, details);
  };
  const handleInitialCallbacks = () => {
    const hasData = state.data && state.error && state.timestamp;
    if (hasData && initializeCallbacks) {
      const details = {
        retries: state.retries,
        timestamp: new Date(state.timestamp),
        isFailed: isFailedRequest([state.data, state.error, state.status]),
        isCanceled: false,
        isOffline: !appManager.isOnline
      };
      handleResponseCallbacks([state.data, state.error, state.status], details);
    }
  };
  const handleGetResponseData = ({ data, details, cacheTime }) => {
    const { isCanceled, isFailed, isOffline } = details;
    logger.debug("Received new data");
    if (isCanceled) {
      logger.debug("Skipping canceled error response data");
    }
    if (isFailed && isOffline) {
      logger.debug("Skipping offline error response data");
    }
    setCacheData({ data, details, cacheTime });
  };
  const handleGetLoadingEvent = ({ isLoading }) => {
    actions.setLoading(isLoading, false);
  };
  const handleDownloadProgress = (progress) => {
    var _a;
    (_a = onDownloadProgressCallback == null ? void 0 : onDownloadProgressCallback.current) == null ? void 0 : _a.call(onDownloadProgressCallback, progress);
  };
  const handleUploadProgress = (progress) => {
    var _a;
    (_a = onUploadProgressCallback == null ? void 0 : onUploadProgressCallback.current) == null ? void 0 : _a.call(onUploadProgressCallback, progress);
  };
  const handleRequestStart = (details) => {
    var _a;
    (_a = onRequestStartCallback == null ? void 0 : onRequestStartCallback.current) == null ? void 0 : _a.call(onRequestStartCallback, details);
  };
  const handleResponseStart = (details) => {
    var _a;
    (_a = onResponseStartCallback == null ? void 0 : onResponseStartCallback.current) == null ? void 0 : _a.call(onResponseStartCallback, details);
  };
  const handleResponse = (requestId) => {
    return (data, details) => {
      const event = lifecycleEvents.current.get(requestId);
      event == null ? void 0 : event.unmount();
      lifecycleEvents.current.delete(requestId);
      handleResponseCallbacks(data, details);
    };
  };
  const clearDataListener = () => {
    var _a;
    (_a = dataEvents.current) == null ? void 0 : _a.unmount();
  };
  const addDataListener = (cmd, clear = true) => {
    const loadingUnmount = dispatcher.events.onLoading(cmd.queueKey, handleGetLoadingEvent);
    const getResponseUnmount = cache.events.get(cmd.cacheKey, handleGetResponseData);
    const unmount = () => {
      loadingUnmount();
      getResponseUnmount();
    };
    if (clear)
      clearDataListener();
    dataEvents.current = { unmount };
    return unmount;
  };
  const addLifecycleListeners = (requestId) => {
    const downloadUnmount = commandManager.events.onDownloadProgressById(requestId, handleDownloadProgress);
    const uploadUnmount = commandManager.events.onUploadProgressById(requestId, handleUploadProgress);
    const requestStartUnmount = commandManager.events.onRequestStartById(requestId, handleRequestStart);
    const responseStartUnmount = commandManager.events.onResponseStartById(requestId, handleResponseStart);
    const responseUnmount = commandManager.events.onResponseById(requestId, handleResponse(requestId));
    const unmount = () => {
      downloadUnmount();
      uploadUnmount();
      requestStartUnmount();
      responseStartUnmount();
      responseUnmount();
    };
    lifecycleEvents.current.set(requestId, { unmount });
    return unmount;
  };
  const removeLifecycleListener = (requestId) => {
    const event = lifecycleEvents.current.get(requestId);
    event == null ? void 0 : event.unmount();
    lifecycleEvents.current.delete(requestId);
  };
  const clearLifecycleListeners = () => {
    const events = lifecycleEvents.current;
    const listeners = Array.from(events.values());
    listeners.forEach((value) => {
      value.unmount();
    });
    events.clear();
  };
  useDidUpdate(handleInitialCallbacks, [commandDump.cacheKey, commandDump.queueKey], true);
  useWillUnmount(() => {
    clearLifecycleListeners();
    clearDataListener();
  });
  return [
    {
      onRequest: (callback) => {
        onRequestCallback.current = callback;
      },
      onSuccess: (callback) => {
        onSuccessCallback.current = callback;
      },
      onError: (callback) => {
        onErrorCallback.current = callback;
      },
      onAbort: (callback) => {
        onAbortCallback.current = callback;
      },
      onOfflineError: (callback) => {
        onOfflineErrorCallback.current = callback;
      },
      onFinished: (callback) => {
        onFinishedCallback.current = callback;
      },
      onRequestStart: (callback) => {
        onRequestStartCallback.current = callback;
      },
      onResponseStart: (callback) => {
        onResponseStartCallback.current = callback;
      },
      onDownloadProgress: (callback) => {
        onDownloadProgressCallback.current = callback;
      },
      onUploadProgress: (callback) => {
        onUploadProgressCallback.current = callback;
      }
    },
    {
      addDataListener,
      clearDataListener,
      addLifecycleListeners,
      removeLifecycleListener,
      clearLifecycleListeners
    }
  ];
};

// src/helpers/use-debounce/use-debounce.hooks.ts
import { useRef as useRef2 } from "react";
import { useWillUnmount as useWillUnmount2, useDidUpdate as useDidUpdate2 } from "@better-typed/react-lifecycle-hooks";
var useDebounce = (delay = 600) => {
  const debounce = useRef2({
    time: delay,
    timer: null
  });
  useDidUpdate2(() => {
    debounce.current.time = delay;
  }, [delay]);
  const resetDebounce = () => {
    if (debounce.current.timer !== null)
      clearTimeout(debounce.current.timer);
    debounce.current.timer = null;
  };
  const setDebounce = (callback) => {
    resetDebounce();
    debounce.current.timer = setTimeout(() => {
      callback();
    }, debounce.current.time);
  };
  useWillUnmount2(resetDebounce);
  return { debounce: setDebounce, resetDebounce, active: !!debounce.current.timer };
};

// src/helpers/use-dependent-state/use-dependent-state.constants.ts
var initialState = {
  data: null,
  error: null,
  loading: false,
  status: null,
  retries: 0,
  timestamp: null
};

// src/helpers/use-dependent-state/use-dependent-state.hooks.ts
import { useRef as useRef3 } from "react";
import { useDidUpdate as useDidUpdate3, useForceUpdate } from "@better-typed/react-lifecycle-hooks";

// src/utils/deep-equal.utils.ts
var isEmpty = (value) => {
  const valueType = Object.prototype.toString.call(value);
  if (Array.isArray(value))
    return !value.length;
  if (typeof value === "object" && value !== null && valueType === "[object Object]")
    return !Object.keys(value).length;
  return false;
};
var isEqual = (firstValue, secondValue) => {
  const firstValueType = Object.prototype.toString.call(firstValue);
  const secondValueType = Object.prototype.toString.call(secondValue);
  const firstType = typeof firstValue;
  const secondType = typeof secondValue;
  const isType = (type) => firstType === type && secondType === type;
  const isTypeValue = (type) => firstValueType === type && secondValueType === type;
  if (firstValueType !== secondValueType)
    return false;
  if (firstValue === null && secondValue === null)
    return true;
  if (isType("number") && Number.isNaN(firstValue) && Number.isNaN(secondValue))
    return true;
  if (isEmpty(firstValue) && isEmpty(secondValue))
    return true;
  if (Array.isArray(firstValue) && Array.isArray(secondValue)) {
    if (firstValue.length !== secondValue.length)
      return false;
    return !firstValue.some((element, i) => !isEqual(element, secondValue[i]));
  }
  if (isType("object") && isTypeValue("[object Object]")) {
    if (Object.keys(firstValue).length !== Object.keys(secondValue).length)
      return false;
    return !Object.entries(firstValue).some(([key, value]) => !isEqual(value, secondValue[key]));
  }
  if (firstValue instanceof Date && secondValue instanceof Date) {
    return +firstValue === +secondValue;
  }
  return firstValue === secondValue;
};

// src/helpers/use-dependent-state/use-dependent-state.utils.ts
var getDetailsState = (state, details) => {
  return __spreadValues({
    retries: (state == null ? void 0 : state.retries) || 0,
    timestamp: new Date(),
    isFailed: false,
    isCanceled: false,
    isOffline: false
  }, details);
};
var isStaleCacheData = (cacheTime, cacheTimestamp) => {
  if (!cacheTimestamp)
    return true;
  if (!cacheTime)
    return false;
  return +new Date() > +cacheTimestamp + cacheTime;
};
var getValidCacheData = (command, initialData, cacheData) => {
  const isStale = isStaleCacheData(command.cacheTime, cacheData == null ? void 0 : cacheData.details.timestamp);
  if (!isStale && cacheData) {
    return cacheData;
  }
  if (initialData) {
    return {
      data: initialData,
      details: getDetailsState(),
      cacheTime: 1e3
    };
  }
  return null;
};
var getTimestamp = (timestamp) => {
  return timestamp ? new Date(timestamp) : null;
};
var responseToCacheValue = (response) => {
  if (!response)
    return null;
  return {
    data: response,
    details: getDetailsState(),
    cacheTime: 1e3
  };
};
var getInitialState = (initialData, dispatcher, command) => {
  var _a, _b, _c;
  const { builder, cacheKey } = command;
  const { cache } = builder;
  const cacheData = cache.get(cacheKey);
  const cacheState = getValidCacheData(command, initialData, cacheData);
  const initialLoading = dispatcher.hasRunningRequests(command.queueKey);
  return __spreadProps(__spreadValues({}, initialState), {
    data: ((_a = cacheState == null ? void 0 : cacheState.data) == null ? void 0 : _a[0]) || initialState.data,
    error: ((_b = cacheState == null ? void 0 : cacheState.data) == null ? void 0 : _b[1]) || initialState.error,
    status: ((_c = cacheState == null ? void 0 : cacheState.data) == null ? void 0 : _c[2]) || initialState.status,
    retries: (cacheState == null ? void 0 : cacheState.details.retries) || initialState.retries,
    timestamp: getTimestamp((cacheState == null ? void 0 : cacheState.details.timestamp) || initialState.timestamp),
    loading: initialLoading != null ? initialLoading : initialState.loading
  });
};

// src/helpers/use-dependent-state/use-dependent-state.hooks.ts
var useDependentState = ({
  command,
  dispatcher,
  initialData,
  deepCompare,
  dependencyTracking,
  defaultCacheEmitting = true
}) => {
  const { builder, cacheKey, queueKey, cacheTime } = command;
  const { cache } = builder;
  const forceUpdate = useForceUpdate();
  const state = useRef3(getInitialState(initialData, dispatcher, command));
  const renderKeys = useRef3([]);
  const getStaleStatus = () => {
    const cacheData = cache.get(cacheKey);
    return isStaleCacheData(cacheTime, cacheData == null ? void 0 : cacheData.details.timestamp);
  };
  const renderKeyTrigger = (keys) => {
    const shouldRerender = renderKeys.current.some((renderKey) => keys.includes(renderKey));
    if (shouldRerender)
      forceUpdate();
  };
  const setRenderKey = (renderKey) => {
    if (!renderKeys.current.includes(renderKey)) {
      renderKeys.current.push(renderKey);
    }
  };
  useDidUpdate3(() => {
    state.current.loading = dispatcher.hasRunningRequests(queueKey);
    const newState = getInitialState(initialData, dispatcher, command);
    const hasInitialState = (initialData == null ? void 0 : initialData[0]) === state.current.data;
    const hasState = !!(state.current.data || state.current.error) && !hasInitialState;
    const shouldLoadInitialCache = !hasState && state.current.data;
    const shouldRemovePreviousData = hasState && !state.current.data;
    if (shouldLoadInitialCache || shouldRemovePreviousData) {
      state.current = newState;
    }
  }, [cacheKey, queueKey], true);
  useDidUpdate3(() => {
    const handleDependencyTracking = () => {
      if (!dependencyTracking) {
        Object.keys(state.current).forEach((key) => setRenderKey(key));
      }
    };
    handleDependencyTracking();
  }, [dependencyTracking], true);
  const handleCompare = (firstValue, secondValue) => {
    if (typeof deepCompare === "function") {
      return deepCompare(firstValue, secondValue);
    }
    if (deepCompare) {
      return isEqual(firstValue, secondValue);
    }
    return false;
  };
  const setCacheData = (cacheData) => __async(void 0, null, function* () {
    const newStateValues = {
      data: cacheData.data[0],
      error: cacheData.data[1],
      status: cacheData.data[2],
      retries: cacheData.details.retries,
      timestamp: new Date(cacheData.details.timestamp),
      loading: false
    };
    const changedKeys = Object.keys(newStateValues).filter((key) => {
      const keyValue = key;
      const firstValue = state.current[keyValue];
      const secondValue = newStateValues[keyValue];
      return !handleCompare(firstValue, secondValue);
    });
    state.current = __spreadValues(__spreadValues({}, state.current), newStateValues);
    renderKeyTrigger(changedKeys);
  });
  const actions = {
    setData: (data, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(command, [data, currentState.error, currentState.status], getDetailsState(state.current));
      } else {
        state.current.data = data;
        renderKeyTrigger(["data"]);
      }
    },
    setError: (error, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(command, [currentState.data, error, currentState.status], getDetailsState(state.current, { isFailed: !!error }));
      } else {
        state.current.error = error;
        renderKeyTrigger(["error"]);
      }
    },
    setLoading: (loading, emitToHooks = true) => {
      if (emitToHooks) {
        dispatcher.events.setLoading(queueKey, "", {
          isLoading: loading,
          isRetry: false,
          isOffline: false
        });
      } else {
        state.current.loading = loading;
        renderKeyTrigger(["loading"]);
      }
    },
    setStatus: (status, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(command, [currentState.data, currentState.error, status], getDetailsState(state.current));
      } else {
        state.current.status = status;
        renderKeyTrigger(["status"]);
      }
    },
    setRetries: (retries, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(command, [currentState.data, currentState.error, currentState.status], getDetailsState(state.current, { retries }));
      } else {
        state.current.retries = retries;
        renderKeyTrigger(["retries"]);
      }
    },
    setTimestamp: (timestamp, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(command, [currentState.data, currentState.error, currentState.status], getDetailsState(state.current, { timestamp }));
      } else {
        state.current.timestamp = timestamp;
        renderKeyTrigger(["timestamp"]);
      }
    }
  };
  return [state.current, actions, { setRenderKey, setCacheData, getStaleStatus }];
};

// src/use-fetch/use-fetch.hooks.ts
var useFetch = (command, {
  dependencies = useFetchDefaultOptions.dependencies,
  disabled = useFetchDefaultOptions.disabled,
  dependencyTracking = useFetchDefaultOptions.dependencyTracking,
  revalidateOnMount = useFetchDefaultOptions.revalidateOnMount,
  initialData = useFetchDefaultOptions.initialData,
  refresh = useFetchDefaultOptions.refresh,
  refreshTime = useFetchDefaultOptions.refreshTime,
  refreshBlurred = useFetchDefaultOptions.refreshBlurred,
  refreshOnTabBlur = useFetchDefaultOptions.refreshOnTabBlur,
  refreshOnTabFocus = useFetchDefaultOptions.refreshOnTabFocus,
  refreshOnReconnect = useFetchDefaultOptions.refreshOnReconnect,
  debounce = useFetchDefaultOptions.debounce,
  debounceTime = useFetchDefaultOptions.debounceTime,
  deepCompare = useFetchDefaultOptions.deepCompare
} = useFetchDefaultOptions) => {
  const updateKey = JSON.stringify(command.dump());
  const requestDebounce = useDebounce(debounceTime);
  const refreshDebounce = useDebounce(refreshTime);
  const { cacheKey, queueKey, builder } = command;
  const { cache, fetchDispatcher: dispatcher, appManager, loggerManager } = builder;
  const logger = useRef4(loggerManager.init("useFetch")).current;
  const [state, actions, { setRenderKey, setCacheData, getStaleStatus }] = useDependentState({
    logger,
    command,
    dispatcher,
    initialData,
    deepCompare,
    dependencyTracking
  });
  const [callbacks, listeners] = useCommandEvents({
    state,
    logger,
    actions,
    command,
    dispatcher,
    setCacheData
  });
  const { addDataListener, addLifecycleListeners, clearLifecycleListeners } = listeners;
  const handleFetch = () => {
    if (!disabled) {
      logger.debug(`Adding request to fetch queue`);
      addDataListener(command);
      const requestId = dispatcher.add(command);
      clearLifecycleListeners();
      addLifecycleListeners(requestId);
    } else {
      logger.debug(`Cannot add to fetch queue`, { disabled });
    }
  };
  function handleRefresh() {
    if (!refresh)
      return;
    logger.debug(`Starting refresh counter, request will be send in ${refreshTime}ms`);
    refreshDebounce.debounce(() => {
      const isBlurred = !appManager.isFocused;
      const isFetching = dispatcher.hasRunningRequests(command.queueKey);
      const isQueued = dispatcher.getIsActiveQueue(command.queueKey);
      const isActive = isFetching || isQueued;
      const canRefreshBlurred = isBlurred && refreshBlurred && !isActive;
      const canRefreshFocused = !isBlurred && !isActive;
      if (canRefreshBlurred || canRefreshFocused) {
        handleFetch();
        logger.debug(`Performing refresh request`);
      }
      handleRefresh();
    });
  }
  const revalidate = (invalidateKey) => {
    if (invalidateKey && invalidateKey instanceof Command) {
      cache.events.revalidate(new RegExp(getCommandKey(invalidateKey, true)));
    } else if (invalidateKey) {
      cache.events.revalidate(invalidateKey);
    } else {
      handleFetch();
    }
  };
  const abort = () => {
    command.abort();
  };
  const initialFetchData = () => {
    const hasStaleData = getStaleStatus();
    if (revalidateOnMount || hasStaleData) {
      handleFetch();
    }
  };
  const updateFetchData = () => {
    if (debounce) {
      logger.debug("Debouncing request", { queueKey, command });
      requestDebounce.debounce(() => handleFetch());
    } else {
      handleFetch();
    }
  };
  const handleMountEvents = () => {
    const focusUnmount = appManager.events.onFocus(() => {
      if (refreshOnTabFocus) {
        handleFetch();
        handleRefresh();
      }
    });
    const blurUnmount = appManager.events.onBlur(() => {
      if (refreshOnTabBlur) {
        handleFetch();
        handleRefresh();
      }
    });
    const onlineUnmount = appManager.events.onOnline(() => {
      if (refreshOnReconnect) {
        handleFetch();
        handleRefresh();
      }
    });
    const revalidateUnmount = cache.events.onRevalidate(cacheKey, handleFetch);
    const unmount = () => {
      focusUnmount();
      blurUnmount();
      onlineUnmount();
      revalidateUnmount();
    };
    return unmount;
  };
  useDidUpdate4(handleMountEvents, [updateKey], true);
  useDidMount(initialFetchData);
  useDidUpdate4(updateFetchData, [updateKey, ...dependencies]);
  useDidUpdate4(handleRefresh, [updateKey, ...dependencies, disabled, refresh, refreshTime], true);
  return __spreadProps(__spreadValues(__spreadValues({
    get data() {
      setRenderKey("data");
      return state.data;
    },
    get error() {
      setRenderKey("error");
      return state.error;
    },
    get loading() {
      setRenderKey("loading");
      return state.loading;
    },
    get status() {
      setRenderKey("status");
      return state.status;
    },
    get retries() {
      setRenderKey("retries");
      return state.retries;
    },
    get timestamp() {
      setRenderKey("timestamp");
      return state.timestamp;
    }
  }, actions), callbacks), {
    isDebouncing: requestDebounce.active,
    revalidate,
    abort
  });
};

// src/use-fetch/use-fetch.constants.ts
import { DateInterval } from "@better-typed/hyper-fetch";
var useFetchDefaultOptions = {
  dependencies: [],
  disabled: false,
  dependencyTracking: true,
  revalidateOnMount: true,
  initialData: null,
  refresh: false,
  refreshTime: DateInterval.hour,
  refreshBlurred: false,
  refreshOnTabBlur: false,
  refreshOnTabFocus: false,
  refreshOnReconnect: false,
  debounce: false,
  debounceTime: 400,
  deepCompare: true
};

// src/use-submit/use-submit.hooks.ts
import { useRef as useRef5, useState } from "react";
import {
  Command as Command2,
  getCommandKey as getCommandKey2,
  commandSendRequest
} from "@better-typed/hyper-fetch";
var useSubmit = (commandInstance, {
  disabled = useSubmitDefaultOptions.disabled,
  dependencyTracking = useSubmitDefaultOptions.dependencyTracking,
  initialData = useSubmitDefaultOptions.initialData,
  debounce = useSubmitDefaultOptions.debounce,
  debounceTime = useSubmitDefaultOptions.debounceTime,
  deepCompare = useSubmitDefaultOptions.deepCompare
} = useSubmitDefaultOptions) => {
  const [command, setCommand] = useState(commandInstance);
  const { builder } = command;
  const { cache, submitDispatcher: dispatcher, loggerManager } = builder;
  const logger = useRef5(loggerManager.init("useSubmit")).current;
  const requestDebounce = useDebounce(debounceTime);
  const [state, actions, { setRenderKey, setCacheData }] = useDependentState({
    logger,
    command,
    dispatcher,
    initialData,
    deepCompare,
    dependencyTracking
  });
  const [callbacks, listeners] = useCommandEvents({
    state,
    logger,
    actions,
    command,
    dispatcher,
    setCacheData
  });
  const { addDataListener, addLifecycleListeners } = listeners;
  const handleSubmit = (...parameters) => {
    const options = parameters[0];
    const commandClone = command.clone(options);
    setCommand(commandClone);
    if (disabled) {
      logger.debug(`Cannot add to submit queue`, { disabled, options });
      return [null, null, 0];
    }
    const triggerRequest = () => commandSendRequest(commandClone, "submit", (requestId, cmd) => {
      addDataListener(cmd);
      addLifecycleListeners(requestId);
    });
    return new Promise((resolve) => {
      const performSubmit = () => __async(void 0, null, function* () {
        logger.debug(`Adding request to submit queue`, { disabled, options });
        if (debounce) {
          requestDebounce.debounce(() => __async(void 0, null, function* () {
            const value = yield triggerRequest();
            resolve(value);
          }));
        } else {
          const value = yield triggerRequest();
          resolve(value);
        }
      });
      performSubmit();
    });
  };
  const revalidate = (invalidateKey) => {
    if (!invalidateKey)
      return;
    if (invalidateKey && invalidateKey instanceof Command2) {
      cache.events.revalidate(`/${getCommandKey2(invalidateKey, true)}/`);
    } else {
      cache.events.revalidate(invalidateKey);
    }
  };
  const abort = () => {
    command.abort();
  };
  const handlers = {
    onSubmitRequest: callbacks.onRequest,
    onSubmitSuccess: callbacks.onSuccess,
    onSubmitError: callbacks.onError,
    onSubmitFinished: callbacks.onFinished,
    onSubmitRequestStart: callbacks.onRequestStart,
    onSubmitResponseStart: callbacks.onResponseStart,
    onSubmitDownloadProgress: callbacks.onDownloadProgress,
    onSubmitUploadProgress: callbacks.onUploadProgress,
    onSubmitOfflineError: callbacks.onOfflineError,
    onSubmitAbort: callbacks.onAbort
  };
  return __spreadProps(__spreadValues(__spreadValues({
    submit: handleSubmit,
    get data() {
      setRenderKey("data");
      return state.data;
    },
    get error() {
      setRenderKey("error");
      return state.error;
    },
    get submitting() {
      setRenderKey("loading");
      return state.loading;
    },
    get status() {
      setRenderKey("status");
      return state.status;
    },
    get retries() {
      setRenderKey("retries");
      return state.retries;
    },
    get timestamp() {
      setRenderKey("timestamp");
      return state.timestamp;
    },
    abort
  }, actions), handlers), {
    isDebouncing: false,
    isRefreshed: false,
    revalidate
  });
};

// src/use-submit/use-submit.constants.ts
var useSubmitDefaultOptions = {
  disabled: false,
  dependencyTracking: true,
  cacheOnMount: true,
  initialData: null,
  debounce: false,
  debounceTime: 400,
  suspense: false,
  shouldThrow: false,
  invalidate: [],
  deepCompare: true
};

// src/use-queue/use-queue.hooks.ts
import { useState as useState2, useRef as useRef6 } from "react";
import { getCommandDispatcher } from "@better-typed/hyper-fetch";
import { useDidMount as useDidMount2, useDidUpdate as useDidUpdate5 } from "@better-typed/react-lifecycle-hooks";
var useQueue = (command, options = useQueueDefaultOptions) => {
  const { queueType = useQueueDefaultOptions.queueType } = options;
  const { abortKey, queueKey, builder } = command;
  const { commandManager } = builder;
  const dispatcher = getCommandDispatcher(command, queueType);
  const unmountCallbacks = useRef6(null);
  const [stopped, setStopped] = useState2(false);
  const [requests, setRequests] = useState2([]);
  const createRequestsArray = (queueElements) => {
    return queueElements.map((req) => __spreadProps(__spreadValues({}, req), {
      stopRequest: () => dispatcher[0].stopRequest(queueKey, req.requestId),
      startRequest: () => dispatcher[0].startRequest(queueKey, req.requestId),
      deleteRequest: () => dispatcher[0].delete(queueKey, req.requestId, abortKey)
    }));
  };
  const getInitialState2 = () => {
    const [queue] = dispatcher;
    const commandQueue = queue.getQueue(queueKey);
    setStopped(commandQueue.stopped);
    setRequests(createRequestsArray(commandQueue.requests));
  };
  const mountEvents = () => {
    var _a;
    const [queue] = dispatcher;
    const unmountChange = queue.events.onQueueChange(queueKey, (values) => {
      setStopped(values.stopped);
      setRequests(createRequestsArray(values.requests));
    });
    const unmountDownload = commandManager.events.onDownloadProgress(queueKey, (progress, { requestId }) => {
      setRequests((prev) => prev.map((el) => el.requestId === requestId ? __spreadProps(__spreadValues({}, el), { downloading: progress }) : el));
    });
    const unmountUpload = commandManager.events.onDownloadProgress(queueKey, (progress, { requestId }) => {
      setRequests((prev) => prev.map((el) => el.requestId === requestId ? __spreadProps(__spreadValues({}, el), { uploading: progress }) : el));
    });
    const unmountStatus = queue.events.onQueueStatus(queueKey, (values) => {
      setStopped(values.stopped);
      setRequests(createRequestsArray(values.requests));
    });
    const unmount = () => {
      unmountStatus();
      unmountChange();
      unmountDownload();
      unmountUpload();
    };
    (_a = unmountCallbacks.current) == null ? void 0 : _a.call(unmountCallbacks);
    unmountCallbacks.current = unmount;
    return unmount;
  };
  useDidMount2(getInitialState2);
  useDidUpdate5(mountEvents, [stopped, requests, setRequests, setStopped], true);
  return {
    stopped,
    requests,
    stop: () => dispatcher[0].stop(queueKey),
    pause: () => dispatcher[0].pause(queueKey),
    start: () => dispatcher[0].start(queueKey)
  };
};

// src/use-queue/use-queue.constants.ts
var useQueueDefaultOptions = {
  queueType: "auto"
};

// src/use-cache/use-cache.hooks.ts
import { useRef as useRef7 } from "react";
import { getCommandDispatcher as getCommandDispatcher2, Command as Command3, getCommandKey as getCommandKey3 } from "@better-typed/hyper-fetch";
var useCache = (command, {
  dependencyTracking = useCacheDefaultOptions.dependencyTracking,
  initialData = useCacheDefaultOptions.initialData,
  deepCompare = useCacheDefaultOptions.deepCompare
} = useCacheDefaultOptions) => {
  const { cacheKey, builder } = command;
  const { cache, loggerManager } = builder;
  const logger = useRef7(loggerManager.init("useCache")).current;
  const [dispatcher] = getCommandDispatcher2(command);
  const [state, actions, { setRenderKey, setCacheData }] = useDependentState({
    logger,
    command,
    dispatcher,
    initialData,
    deepCompare,
    dependencyTracking
  });
  const [callbacks] = useCommandEvents({
    state,
    logger,
    actions,
    command,
    dispatcher,
    setCacheData
  });
  const revalidate = (revalidateKey) => {
    if (revalidateKey && revalidateKey instanceof Command3) {
      cache.events.revalidate(`/${getCommandKey3(revalidateKey, true)}/`);
    } else if (revalidateKey) {
      cache.events.revalidate(revalidateKey);
    } else {
      cache.events.revalidate(cacheKey);
    }
  };
  return __spreadProps(__spreadValues({
    get data() {
      setRenderKey("data");
      return state.data;
    },
    get error() {
      setRenderKey("error");
      return state.error;
    },
    get loading() {
      setRenderKey("loading");
      return state.loading;
    },
    get status() {
      setRenderKey("status");
      return state.status;
    },
    get retries() {
      setRenderKey("retries");
      return state.retries;
    },
    get timestamp() {
      setRenderKey("timestamp");
      return state.timestamp;
    },
    onCacheError: callbacks.onError,
    onCacheSuccess: callbacks.onSuccess,
    onCacheChange: callbacks.onFinished
  }, actions), {
    revalidate
  });
};

// src/use-cache/use-cache.constants.ts
var useCacheDefaultOptions = {
  dependencyTracking: true,
  initialData: null,
  deepCompare: true
};

// src/use-app-manager/use-app-manager.hooks.ts
import { useState as useState3 } from "react";
import { useDidMount as useDidMount3 } from "@better-typed/react-lifecycle-hooks";
var useAppManager = (builder) => {
  const [online, setIsOnline] = useState3(builder.appManager.isOnline);
  const [focused, setIsFocused] = useState3(builder.appManager.isFocused);
  const mountEvents = () => {
    const unmountIsOnline = builder.appManager.events.onOnline(() => setIsOnline(true));
    const unmountIsOffline = builder.appManager.events.onOffline(() => setIsOnline(false));
    const unmountIsFocus = builder.appManager.events.onFocus(() => setIsFocused(true));
    const unmountIsBlur = builder.appManager.events.onBlur(() => setIsFocused(false));
    return () => {
      unmountIsOnline();
      unmountIsOffline();
      unmountIsFocus();
      unmountIsBlur();
    };
  };
  const setOnline = (isOnline) => {
    builder.appManager.setOnline(isOnline);
  };
  const setFocused = (isFocused) => {
    builder.appManager.setFocused(isFocused);
  };
  useDidMount3(mountEvents);
  return { isOnline: online, isFocused: focused, setOnline, setFocused };
};
export {
  getDetailsState,
  getInitialState,
  getTimestamp,
  getValidCacheData,
  initialState,
  isEmpty,
  isEqual,
  isStaleCacheData,
  responseToCacheValue,
  useAppManager,
  useCache,
  useCacheDefaultOptions,
  useCommandEvents,
  useDebounce,
  useDependentState,
  useFetch,
  useFetchDefaultOptions,
  useQueue,
  useQueueDefaultOptions,
  useSubmit,
  useSubmitDefaultOptions
};
