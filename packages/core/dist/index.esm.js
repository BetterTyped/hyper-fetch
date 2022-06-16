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

// src/effect/fetch.effect.ts
var FetchEffect = class {
  constructor(config) {
    this.config = config;
    this.getEffectKey = () => {
      return this.config.effectKey;
    };
    this.onTrigger = (command) => {
      var _a, _b;
      (_b = (_a = this.config).onTrigger) == null ? void 0 : _b.call(_a, command);
    };
    this.onStart = (command) => {
      var _a, _b;
      (_b = (_a = this.config).onStart) == null ? void 0 : _b.call(_a, command);
    };
    this.onSuccess = (response, command) => {
      var _a, _b;
      (_b = (_a = this.config).onSuccess) == null ? void 0 : _b.call(_a, response, command);
    };
    this.onError = (response, command) => {
      var _a, _b;
      (_b = (_a = this.config).onError) == null ? void 0 : _b.call(_a, response, command);
    };
    this.onFinished = (response, command) => {
      var _a, _b;
      (_b = (_a = this.config).onFinished) == null ? void 0 : _b.call(_a, response, command);
    };
  }
};

// src/client/fetch.client.ts
var fetchClient = (command, requestId) => __async(void 0, null, function* () {
  if (!window.XMLHttpRequest) {
    throw new Error("There is no XMLHttpRequest, make sure it's provided to use Hyper Fetch built-in client.");
  }
  const {
    fullUrl,
    headers,
    payload,
    config,
    createAbortListener,
    onBeforeRequest,
    onRequestStart,
    onRequestProgress,
    onRequestEnd,
    onResponseStart,
    onResponseProgress,
    onResponseEnd,
    onSuccess,
    onAbortError,
    onTimeoutError,
    onUnexpectedError,
    onError
  } = yield getClientBindings(command, requestId);
  const { method } = command;
  const xhr = new XMLHttpRequest();
  xhr.timeout = defaultTimeout;
  const abort = () => xhr.abort();
  return new Promise((resolve) => {
    Object.entries(config).forEach(([name, value]) => {
      xhr[name] = value;
    });
    xhr.open(method, fullUrl, true);
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    const unmountListener = createAbortListener(abort);
    xhr.upload.onprogress = handleProgress(onRequestProgress);
    xhr.onloadstart = () => {
      onRequestEnd();
      onResponseStart();
    };
    xhr.onprogress = handleProgress(onResponseProgress);
    xhr.onloadend = () => {
      unmountListener();
      onResponseEnd();
    };
    xhr.onabort = onAbortError;
    xhr.ontimeout = onTimeoutError;
    xhr.upload.onabort = onAbortError;
    xhr.upload.ontimeout = onTimeoutError;
    xhr.onerror = handleError({ onError, onUnexpectedError }, resolve);
    xhr.onreadystatechange = handleReadyStateChange({ onError, onSuccess, onResponseEnd }, resolve);
    onBeforeRequest();
    xhr.send(payload);
    onRequestStart();
  });
});

// src/client/fetch.client.utils.ts
var getRequestConfig = (command) => {
  return __spreadValues(__spreadValues({}, command.builder.requestConfig), command.commandOptions.options);
};
var getErrorMessage = (errorCase) => {
  if (errorCase === "timeout") {
    return new Error("Request timeout");
  }
  if (errorCase === "abort") {
    return new Error("Request cancelled");
  }
  return new Error("Unexpected error");
};
var parseResponse = (response) => {
  try {
    return JSON.parse(response);
  } catch (err) {
    return response;
  }
};
var parseErrorResponse = (response) => {
  return response ? parseResponse(response) : getErrorMessage();
};
var handleReadyStateChange = ({
  onError,
  onResponseEnd,
  onSuccess
}, resolve) => {
  return (e) => {
    const event = e;
    const finishedState = 4;
    if (event.target && event.target.readyState === finishedState) {
      const { status } = event.target;
      const isSuccess = String(status).startsWith("2") || String(status).startsWith("3");
      onResponseEnd();
      if (isSuccess) {
        const data = parseResponse(event.target.response);
        onSuccess(data, status, resolve);
      } else {
        const data = parseErrorResponse(event.target.response);
        onError(data, status, resolve);
      }
    }
  };
};
var handleProgress = (onProgress) => {
  return (e) => {
    const event = e;
    const progress = {
      total: event.total,
      loaded: event.loaded
    };
    onProgress(progress);
  };
};
var handleError = ({ onError, onUnexpectedError }, resolve) => {
  return (e) => {
    const event = e;
    if (event.target) {
      const data = parseErrorResponse(event.target.response);
      onError(data, event.target.status, resolve);
    } else {
      onUnexpectedError();
    }
  };
};

// src/utils/uuid.utils.ts
var getUniqueRequestId = (key) => {
  return `${key}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;
};

// src/constants/time.constants.ts
var DateInterval = /* @__PURE__ */ ((DateInterval2) => {
  DateInterval2[DateInterval2["second"] = 1e3] = "second";
  DateInterval2[DateInterval2["minute"] = 6e4] = "minute";
  DateInterval2[DateInterval2["hour"] = 36e5] = "hour";
  DateInterval2[DateInterval2["day"] = 864e5] = "day";
  DateInterval2[DateInterval2["week"] = 6048e5] = "week";
  DateInterval2[DateInterval2["month30"] = 2592e6] = "month30";
  DateInterval2[DateInterval2["month31"] = 26784e5] = "month31";
  DateInterval2[DateInterval2["year"] = 31536e6] = "year";
  DateInterval2[DateInterval2["yearLeap"] = 316224e5] = "yearLeap";
  return DateInterval2;
})(DateInterval || {});

// src/constants/http.constants.ts
var HttpMethodsEnum = /* @__PURE__ */ ((HttpMethodsEnum2) => {
  HttpMethodsEnum2["get"] = "GET";
  HttpMethodsEnum2["post"] = "POST";
  HttpMethodsEnum2["put"] = "PUT";
  HttpMethodsEnum2["patch"] = "PATCH";
  HttpMethodsEnum2["delete"] = "DELETE";
  return HttpMethodsEnum2;
})(HttpMethodsEnum || {});

// src/command/command.ts
var Command = class {
  constructor(builder, commandOptions, commandDump, dataMapper) {
    this.builder = builder;
    this.commandOptions = commandOptions;
    this.commandDump = commandDump;
    this.dataMapper = dataMapper;
    this.setHeaders = (headers) => {
      return this.clone({ headers });
    };
    this.setAuth = (auth) => {
      return this.clone({ auth });
    };
    this.setParams = (params) => {
      return this.clone({ params });
    };
    this.setData = (data) => {
      var _a;
      const modifiedData = ((_a = this.dataMapper) == null ? void 0 : _a.call(this, data)) || data;
      return this.clone({
        data: modifiedData
      });
    };
    this.setQueryParams = (queryParams) => {
      return this.clone({ queryParams });
    };
    this.setOptions = (options) => {
      return this.clone({ options });
    };
    this.setCancelable = (cancelable) => {
      return this.clone({ cancelable });
    };
    this.setRetry = (retry) => {
      return this.clone({ retry });
    };
    this.setRetryTime = (retryTime) => {
      return this.clone({ retryTime });
    };
    this.setCache = (cache) => {
      return this.clone({ cache });
    };
    this.setCacheTime = (cacheTime) => {
      return this.clone({ cacheTime });
    };
    this.setQueued = (queued) => {
      return this.clone({ queued });
    };
    this.setAbortKey = (abortKey) => {
      this.updatedAbortKey = true;
      return this.clone({ abortKey });
    };
    this.setCacheKey = (cacheKey) => {
      this.updatedCacheKey = true;
      return this.clone({ cacheKey });
    };
    this.setQueueKey = (queueKey) => {
      this.updatedQueueKey = true;
      return this.clone({ queueKey });
    };
    this.setEffectKey = (effectKey) => {
      this.updatedEffectKey = true;
      return this.clone({ effectKey });
    };
    this.setDeduplicate = (deduplicate) => {
      return this.clone({ deduplicate });
    };
    this.setDeduplicateTime = (deduplicateTime) => {
      return this.clone({ deduplicateTime });
    };
    this.setUsed = (used) => {
      return this.clone({ used });
    };
    this.setOffline = (offline) => {
      return this.clone({ offline });
    };
    this.setDataMapper = (mapper) => {
      if (this.dataMapper) {
        console.warn("Mapper is already setup on the command.");
        return this.clone();
      }
      return this.clone(void 0, mapper);
    };
    this.abort = () => {
      this.builder.commandManager.abortByKey(this.abortKey);
      return this.clone();
    };
    this.paramsMapper = (params, queryParams) => {
      let endpoint = this.commandOptions.endpoint;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
        });
      }
      if (queryParams) {
        endpoint += this.builder.stringifyQueryParams(queryParams);
      }
      return endpoint;
    };
    this.exec = (options) => __async(this, null, function* () {
      const { client } = this.builder;
      const command = this.clone(options);
      const requestId = getUniqueRequestId(this.queueKey);
      return client(command, requestId);
    });
    this.send = (options, requestCallback) => __async(this, null, function* () {
      const command = this.clone(options);
      return commandSendRequest(command, options == null ? void 0 : options.dispatcherType, requestCallback);
    });
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    const {
      endpoint,
      headers,
      auth = true,
      method = "GET" /* get */,
      options,
      cancelable = false,
      retry = 0,
      retryTime = 500,
      cache = true,
      cacheTime = 6e4 /* minute */ * 5,
      queued = false,
      offline = true,
      abortKey,
      cacheKey,
      queueKey,
      effectKey,
      deduplicate = false,
      deduplicateTime = 10
    } = __spreadValues(__spreadValues({}, this.builder.commandConfig), commandOptions);
    this.endpoint = (_a = commandDump == null ? void 0 : commandDump.endpoint) != null ? _a : endpoint;
    this.headers = (_b = commandDump == null ? void 0 : commandDump.headers) != null ? _b : headers;
    this.auth = (_c = commandDump == null ? void 0 : commandDump.auth) != null ? _c : auth;
    this.method = method;
    this.params = commandDump == null ? void 0 : commandDump.params;
    this.data = commandDump == null ? void 0 : commandDump.data;
    this.queryParams = commandDump == null ? void 0 : commandDump.queryParams;
    this.options = (_d = commandDump == null ? void 0 : commandDump.options) != null ? _d : options;
    this.cancelable = (_e = commandDump == null ? void 0 : commandDump.cancelable) != null ? _e : cancelable;
    this.retry = (_f = commandDump == null ? void 0 : commandDump.retry) != null ? _f : retry;
    this.retryTime = (_g = commandDump == null ? void 0 : commandDump.retryTime) != null ? _g : retryTime;
    this.cache = (_h = commandDump == null ? void 0 : commandDump.cache) != null ? _h : cache;
    this.cacheTime = (_i = commandDump == null ? void 0 : commandDump.cacheTime) != null ? _i : cacheTime;
    this.queued = (_j = commandDump == null ? void 0 : commandDump.queued) != null ? _j : queued;
    this.offline = (_k = commandDump == null ? void 0 : commandDump.offline) != null ? _k : offline;
    this.abortKey = (_m = (_l = commandDump == null ? void 0 : commandDump.abortKey) != null ? _l : abortKey) != null ? _m : getSimpleKey(this);
    this.cacheKey = (_o = (_n = commandDump == null ? void 0 : commandDump.cacheKey) != null ? _n : cacheKey) != null ? _o : getCommandKey(this);
    this.queueKey = (_q = (_p = commandDump == null ? void 0 : commandDump.queueKey) != null ? _p : queueKey) != null ? _q : getSimpleKey(this);
    this.effectKey = (_s = (_r = commandDump == null ? void 0 : commandDump.effectKey) != null ? _r : effectKey) != null ? _s : getSimpleKey(this);
    this.used = (_t = commandDump == null ? void 0 : commandDump.used) != null ? _t : false;
    this.deduplicate = (_u = commandDump == null ? void 0 : commandDump.deduplicate) != null ? _u : deduplicate;
    this.deduplicateTime = (_v = commandDump == null ? void 0 : commandDump.deduplicateTime) != null ? _v : deduplicateTime;
    this.updatedAbortKey = (_w = commandDump == null ? void 0 : commandDump.updatedAbortKey) != null ? _w : false;
    this.updatedCacheKey = (_x = commandDump == null ? void 0 : commandDump.updatedCacheKey) != null ? _x : false;
    this.updatedQueueKey = (_y = commandDump == null ? void 0 : commandDump.updatedQueueKey) != null ? _y : false;
    this.updatedEffectKey = (_z = commandDump == null ? void 0 : commandDump.updatedEffectKey) != null ? _z : false;
  }
  dump() {
    return {
      commandOptions: this.commandOptions,
      endpoint: this.endpoint,
      headers: this.headers,
      auth: this.auth,
      method: this.method,
      params: this.params,
      data: this.data,
      queryParams: this.queryParams,
      options: this.options,
      cancelable: this.cancelable,
      retry: this.retry,
      retryTime: this.retryTime,
      cache: this.cache,
      cacheTime: this.cacheTime,
      queued: this.queued,
      offline: this.offline,
      abortKey: this.abortKey,
      cacheKey: this.cacheKey,
      queueKey: this.queueKey,
      effectKey: this.effectKey,
      used: this.used,
      disableResponseInterceptors: this.commandOptions.disableResponseInterceptors,
      disableRequestInterceptors: this.commandOptions.disableRequestInterceptors,
      updatedAbortKey: this.updatedAbortKey,
      updatedCacheKey: this.updatedCacheKey,
      updatedQueueKey: this.updatedQueueKey,
      updatedEffectKey: this.updatedEffectKey,
      deduplicate: this.deduplicate,
      deduplicateTime: this.deduplicateTime
    };
  }
  clone(options, mapper) {
    const dump = this.dump();
    const commandDump = __spreadProps(__spreadValues(__spreadValues({}, dump), options), {
      abortKey: this.updatedAbortKey ? (options == null ? void 0 : options.abortKey) || this.abortKey : void 0,
      cacheKey: this.updatedCacheKey ? (options == null ? void 0 : options.cacheKey) || this.cacheKey : void 0,
      queueKey: this.updatedQueueKey ? (options == null ? void 0 : options.queueKey) || this.queueKey : void 0,
      endpoint: this.paramsMapper((options == null ? void 0 : options.params) || this.params, (options == null ? void 0 : options.queryParams) || this.queryParams),
      queryParams: (options == null ? void 0 : options.queryParams) || this.queryParams,
      data: (options == null ? void 0 : options.data) || this.data
    });
    const cloned = new Command(this.builder, this.commandOptions, commandDump, mapper);
    return cloned;
  }
};

// src/dispatcher/dispatcher.constants.ts
var DispatcherRequestType = /* @__PURE__ */ ((DispatcherRequestType2) => {
  DispatcherRequestType2["oneByOne"] = "one-by-one";
  DispatcherRequestType2["allAtOnce"] = "all-at-once";
  DispatcherRequestType2["previousCanceled"] = "previous-canceled";
  DispatcherRequestType2["deduplicated"] = "deduplicated";
  return DispatcherRequestType2;
})(DispatcherRequestType || {});

// src/dispatcher/dispatcher.events.ts
var getDispatcherEvents = (emitter) => ({
  setLoading: (queueKey, requestId, values) => {
    emitter.emit(getDispatcherLoadingIdEventKey(requestId), values);
    emitter.emit(getDispatcherLoadingEventKey(queueKey), values);
  },
  emitRemove: (requestId) => {
    emitter.emit(getDispatcherRemoveEventKey(requestId));
  },
  setDrained: (queueKey, values) => {
    emitter.emit(getDispatcherDrainedEventKey(queueKey), values);
  },
  setQueueStatus: (queueKey, values) => {
    emitter.emit(getDispatcherStatusEventKey(queueKey), values);
  },
  setQueueChanged: (queueKey, values) => {
    emitter.emit(getDispatcherChangeEventKey(queueKey), values);
  },
  onLoading: (queueKey, callback) => {
    emitter.on(getDispatcherLoadingEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherLoadingEventKey(queueKey), callback);
  },
  onLoadingById: (requestId, callback) => {
    emitter.on(getDispatcherLoadingIdEventKey(requestId), callback);
    return () => emitter.removeListener(getDispatcherLoadingIdEventKey(requestId), callback);
  },
  onRemove: (requestId, callback) => {
    emitter.on(getDispatcherRemoveEventKey(requestId), callback);
    return () => emitter.removeListener(getDispatcherRemoveEventKey(requestId), callback);
  },
  onDrained: (queueKey, callback) => {
    emitter.on(getDispatcherDrainedEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherDrainedEventKey(queueKey), callback);
  },
  onQueueStatus: (queueKey, callback) => {
    emitter.on(getDispatcherStatusEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherStatusEventKey(queueKey), callback);
  },
  onQueueChange: (queueKey, callback) => {
    emitter.on(getDispatcherChangeEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherChangeEventKey(queueKey), callback);
  }
});

// src/dispatcher/dispatcher.ts
import EventEmitter from "events";
var Dispatcher = class {
  constructor(builder, options) {
    this.builder = builder;
    this.options = options;
    this.emitter = new EventEmitter();
    this.events = getDispatcherEvents(this.emitter);
    this.storage = /* @__PURE__ */ new Map();
    this.requestCount = /* @__PURE__ */ new Map();
    this.runningRequests = /* @__PURE__ */ new Map();
    this.start = (queueKey) => {
      const queue = this.getQueue(queueKey);
      queue.stopped = false;
      this.setQueue(queueKey, queue);
      this.flushQueue(queueKey);
      this.events.setQueueStatus(queueKey, queue);
    };
    this.pause = (queueKey) => {
      const queue = this.getQueue(queueKey);
      queue.stopped = true;
      this.setQueue(queueKey, queue);
      this.events.setQueueStatus(queueKey, queue);
    };
    this.stop = (queueKey) => {
      const queue = this.getQueue(queueKey);
      queue.stopped = true;
      this.setQueue(queueKey, queue);
      this.cancelRunningRequests(queueKey);
      this.events.setQueueStatus(queueKey, queue);
    };
    this.getQueuesKeys = () => {
      return Array.from(this.storage.keys());
    };
    this.getQueue = (queueKey) => {
      const initialQueueState = { requests: [], stopped: false };
      const storedEntity = this.storage.get(queueKey);
      return storedEntity || initialQueueState;
    };
    this.getIsActiveQueue = (queueKey) => {
      const queue = this.getQueue(queueKey);
      const hasAvailableRequests = queue.requests.some((req) => !req.stopped);
      const isRunningQueue = !queue.stopped;
      return hasAvailableRequests && isRunningQueue;
    };
    this.addQueueElement = (queueKey, dispatcherDump) => {
      const queue = this.getQueue(queueKey);
      queue.requests.push(dispatcherDump);
      this.setQueue(queueKey, queue);
    };
    this.setQueue = (queueKey, queue) => {
      var _a, _b;
      this.storage.set(queueKey, queue);
      (_b = (_a = this.options) == null ? void 0 : _a.onUpdateStorage) == null ? void 0 : _b.call(_a, queueKey, queue);
      this.events.setQueueChanged(queueKey, queue);
      return queue;
    };
    this.clearQueue = (queueKey) => {
      var _a, _b;
      const queue = this.getQueue(queueKey);
      const newQueue = { requests: [], stopped: queue.stopped };
      this.storage.set(queueKey, newQueue);
      (_b = (_a = this.options) == null ? void 0 : _a.onDeleteFromStorage) == null ? void 0 : _b.call(_a, queueKey, newQueue);
      this.events.setQueueChanged(queueKey, queue);
      return queue;
    };
    this.flushQueue = (queueKey) => __async(this, null, function* () {
      const queue = this.getQueue(queueKey);
      const runningRequests = this.getRunningRequests(queueKey);
      const queueElement = queue.requests.find((request) => !request.stopped);
      const isStopped = queue && queue.stopped;
      const isOffline = !this.builder.appManager.isOnline;
      const isQueued = queueElement == null ? void 0 : queueElement.commandDump.queued;
      const isOngoing = runningRequests.length;
      const isEmpty = !queueElement;
      if (isStopped) {
        return;
      }
      if (isOffline) {
        return;
      }
      if (isEmpty) {
        return;
      }
      if (!isQueued) {
        queue.requests.forEach((element) => {
          if (!this.hasRunningRequest(queueKey, element.requestId)) {
            this.performRequest(element);
          }
        });
        return;
      }
      if (isOngoing) {
        return;
      }
      yield this.performRequest(queueElement);
      this.flushQueue(queueKey);
    });
    this.flush = () => __async(this, null, function* () {
      const keys = this.getQueuesKeys();
      for (const key of keys) {
        const storageElement = this.getQueue(key);
        if (storageElement) {
          this.flushQueue(key);
        }
      }
    });
    this.clear = () => {
      var _a, _b;
      const keys = this.getQueuesKeys();
      keys.forEach((queueKey) => this.cancelRunningRequests(queueKey));
      this.runningRequests.clear();
      this.storage.clear();
      (_b = (_a = this.options) == null ? void 0 : _a.onClearStorage) == null ? void 0 : _b.call(_a, this);
    };
    this.startRequest = (queueKey, requestId) => {
      const queue = this.getQueue(queueKey);
      const request = queue.requests.find((element) => element.requestId === requestId);
      if (request) {
        request.stopped = false;
        this.setQueue(queueKey, queue);
        this.flushQueue(queueKey);
        this.events.setQueueStatus(queueKey, queue);
      }
    };
    this.stopRequest = (queueKey, requestId) => {
      const queue = this.getQueue(queueKey);
      const request = queue.requests.find((element) => element.requestId === requestId);
      if (request) {
        request.stopped = true;
        this.setQueue(queueKey, queue);
      }
      this.cancelRunningRequest(queueKey, requestId);
      this.events.setQueueStatus(queueKey, queue);
    };
    this.getAllRunningRequest = () => {
      return Array.from(this.runningRequests.values()).flat();
    };
    this.getRunningRequests = (queueKey) => {
      return this.runningRequests.get(queueKey) || [];
    };
    this.getRunningRequest = (queueKey, requestId) => {
      const runningRequests = this.getRunningRequests(queueKey);
      return runningRequests.find((req) => req.requestId === requestId);
    };
    this.addRunningRequest = (queueKey, requestId, command) => {
      const runningRequests = this.getRunningRequests(queueKey);
      runningRequests.push({ requestId, command });
      this.runningRequests.set(queueKey, runningRequests);
    };
    this.hasRunningRequests = (queueKey) => {
      return !!this.getRunningRequests(queueKey).length;
    };
    this.hasRunningRequest = (queueKey, requestId) => {
      const runningRequests = this.getRunningRequests(queueKey);
      return !!runningRequests.find((req) => req.requestId === requestId);
    };
    this.cancelRunningRequests = (queueKey) => {
      var _a;
      (_a = this.runningRequests.get(queueKey)) == null ? void 0 : _a.forEach((request) => {
        this.builder.commandManager.abortByRequestId(request.command.abortKey, request.requestId);
      });
      this.deleteRunningRequests(queueKey);
    };
    this.cancelRunningRequest = (queueKey, requestId) => {
      const requests = this.getRunningRequests(queueKey).filter((request) => {
        if (request.requestId === requestId) {
          this.builder.commandManager.abortByRequestId(request.command.abortKey, request.requestId);
          return false;
        }
        return true;
      });
      this.runningRequests.set(queueKey, requests);
    };
    this.deleteRunningRequests = (queueKey) => {
      this.runningRequests.set(queueKey, []);
    };
    this.deleteRunningRequest = (queueKey, requestId) => {
      const runningRequests = this.getRunningRequests(queueKey);
      this.runningRequests.set(queueKey, runningRequests.filter((req) => req.requestId !== requestId));
    };
    this.getQueueRequestCount = (queueKey) => {
      return this.requestCount.get(queueKey) || 0;
    };
    this.incrementQueueRequestCount = (queueKey) => {
      const count = this.requestCount.get(queueKey) || 0;
      this.requestCount.set(queueKey, count + 1);
    };
    this.createStorageElement = (command) => {
      const requestId = getUniqueRequestId(command.queueKey);
      const storageElement = {
        requestId,
        timestamp: +new Date(),
        commandDump: command.dump(),
        retries: 0,
        stopped: false
      };
      return storageElement;
    };
    this.add = (command) => {
      const { queueKey } = command;
      const storageElement = this.createStorageElement(command);
      const { requestId } = storageElement;
      const queue = this.getQueue(queueKey);
      const [latestRequest] = queue.requests.slice(-1);
      const requestType = getRequestType(command, latestRequest);
      switch (requestType) {
        case "one-by-one" /* oneByOne */: {
          this.addQueueElement(queueKey, storageElement);
          this.flushQueue(queueKey);
          return requestId;
        }
        case "previous-canceled" /* previousCanceled */: {
          this.cancelRunningRequests(queueKey);
          this.clearQueue(queueKey);
          this.addQueueElement(queueKey, storageElement);
          this.flushQueue(queueKey);
          return requestId;
        }
        case "deduplicated" /* deduplicated */: {
          return queue.requests[0].requestId;
        }
        default: {
          this.addQueueElement(queueKey, storageElement);
          this.flushQueue(queueKey);
          return requestId;
        }
      }
    };
    this.delete = (queueKey, requestId, abortKey) => {
      var _a, _b;
      const queue = this.getQueue(queueKey);
      queue.requests = queue.requests.filter((req) => req.requestId !== requestId);
      this.storage.set(queueKey, queue);
      if (this.hasRunningRequest(queueKey, requestId)) {
        this.builder.commandManager.abortByRequestId(abortKey, requestId);
      } else {
        this.builder.commandManager.removeAbortController(abortKey, requestId);
      }
      (_b = (_a = this.options) == null ? void 0 : _a.onDeleteFromStorage) == null ? void 0 : _b.call(_a, queueKey, queue);
      this.events.setQueueChanged(queueKey, queue);
      this.events.emitRemove(requestId);
      if (!queue.requests.length) {
        this.events.setDrained(queueKey, queue);
      }
      return queue;
    };
    this.performRequest = (storageElement) => __async(this, null, function* () {
      var _a;
      const command = new Command(this.builder, storageElement.commandDump.commandOptions, storageElement.commandDump);
      const { commandDump, requestId } = storageElement;
      const { retry, retryTime, queueKey, cacheKey, abortKey, offline } = commandDump;
      const { client, commandManager, cache, appManager } = this.builder;
      const canRetry = canRetryRequest(storageElement.retries, retry);
      const isOffline = !appManager.isOnline && offline;
      const isAlreadyRunning = this.hasRunningRequest(queueKey, requestId);
      const isStopped = storageElement.stopped;
      if (isOffline || isAlreadyRunning || isStopped) {
        return;
      }
      this.addRunningRequest(queueKey, requestId, command);
      this.events.setLoading(queueKey, requestId, {
        isLoading: true,
        isRetry: !!storageElement.retries,
        isOffline
      });
      this.incrementQueueRequestCount(queueKey);
      const response = yield client(command, requestId);
      const isOfflineResponseStatus = !appManager.isOnline;
      const isFailed = isFailedRequest(response);
      const isCanceled = ((_a = response[1]) == null ? void 0 : _a.message) === getErrorMessage("abort").message;
      this.deleteRunningRequest(queueKey, requestId);
      const requestDetails = {
        isFailed,
        isCanceled,
        isOffline: isOfflineResponseStatus,
        retries: storageElement.retries,
        timestamp: new Date()
      };
      this.events.setLoading(queueKey, requestId, {
        isLoading: false,
        isRetry: !!storageElement.retries,
        isOffline
      });
      commandManager.events.emitResponse(cacheKey, requestId, response, requestDetails);
      cache.set(command, response, requestDetails);
      if (isCanceled) {
        const queue = this.getQueue(queueKey);
        const request = queue == null ? void 0 : queue.requests.find((req) => req.requestId === requestId);
        if (!queue.stopped && !(request == null ? void 0 : request.stopped)) {
          this.delete(queueKey, requestId, abortKey);
        }
        return;
      }
      if (isFailed && isOfflineResponseStatus) {
        if (!offline)
          this.delete(queueKey, requestId, abortKey);
        return;
      }
      if (!isFailed) {
        this.delete(queueKey, requestId, abortKey);
        return;
      }
      if (isFailed && canRetry) {
        setTimeout(() => __async(this, null, function* () {
          yield this.performRequest(__spreadProps(__spreadValues({}, storageElement), {
            retries: storageElement.retries + 1
          }));
        }), retryTime || 0);
      } else {
        this.delete(queueKey, requestId, abortKey);
      }
    });
    var _a, _b, _c;
    if ((_a = this.options) == null ? void 0 : _a.storage) {
      this.storage = this.options.storage;
    }
    this.builder.appManager.events.onOnline(() => {
      this.flush();
    });
    (_c = (_b = this.options) == null ? void 0 : _b.onInitialization) == null ? void 0 : _c.call(_b, this);
  }
};

// src/dispatcher/dispatcher.utils.ts
var getDispatcherLoadingEventKey = (key) => {
  return `${key}-loading-event`;
};
var getDispatcherLoadingIdEventKey = (key) => {
  return `${key}-loading-event-by-id`;
};
var getDispatcherRemoveEventKey = (key) => {
  return `${key}-remove-event`;
};
var getDispatcherDrainedEventKey = (key) => {
  return `${key}-drained-event`;
};
var getDispatcherStatusEventKey = (key) => {
  return `${key}-status-event`;
};
var getDispatcherChangeEventKey = (key) => {
  return `${key}-change-event`;
};
var getIsEqualTimestamp = (currentTimestamp, threshold, queueTimestamp) => {
  if (!queueTimestamp) {
    return false;
  }
  return queueTimestamp - currentTimestamp <= threshold;
};
var canRetryRequest = (retries, retry) => {
  if (retry === true) {
    return true;
  }
  if (retry && retries <= retry - 1) {
    return true;
  }
  return false;
};
var getRequestType = (command, latestRequest) => {
  const { queued, cancelable, deduplicate } = command;
  const canDeduplicate = latestRequest ? +new Date() - latestRequest.timestamp <= command.deduplicateTime : false;
  if (queued) {
    return "one-by-one" /* oneByOne */;
  }
  if (cancelable) {
    return "previous-canceled" /* previousCanceled */;
  }
  if (canDeduplicate && deduplicate) {
    return "deduplicated" /* deduplicated */;
  }
  return "all-at-once" /* allAtOnce */;
};
var isFailedRequest = (data) => {
  const [, , status] = data;
  if (!status || status >= 400) {
    return true;
  }
  return false;
};

// src/command/command.utils.ts
var stringifyKey = (value) => {
  try {
    if (typeof value === "string")
      return value;
    if (value === void 0 || value === null)
      return "";
    const data = JSON.stringify(value);
    if (typeof data !== "string")
      throw new Error();
    return data;
  } catch (_) {
    return "";
  }
};
var getProgressValue = ({ loaded, total }) => {
  if (!loaded || !total)
    return 0;
  return Number((loaded * 100 / total).toFixed(0));
};
var getRequestEta = (startDate, progressDate, { total, loaded }) => {
  const timeElapsed = +progressDate - +startDate || 1;
  const uploadSpeed = loaded / timeElapsed;
  const sizeLeft = total - loaded;
  const estimatedTimeValue = uploadSpeed ? sizeLeft / uploadSpeed : null;
  const timeLeft = total === loaded ? 0 : estimatedTimeValue;
  return { timeLeft, sizeLeft };
};
var getProgressData = (requestStartTime, progressDate, progressEvent) => {
  const { total, loaded } = progressEvent;
  if (Number.isNaN(total) || Number.isNaN(loaded)) {
    return {
      progress: 0,
      timeLeft: 0,
      sizeLeft: 0,
      total: 0,
      loaded: 0,
      startTimestamp: +requestStartTime
    };
  }
  const { timeLeft, sizeLeft } = getRequestEta(requestStartTime, progressDate, progressEvent);
  return {
    progress: getProgressValue(progressEvent),
    timeLeft,
    sizeLeft,
    total,
    loaded,
    startTimestamp: +requestStartTime
  };
};
var getSimpleKey = (command) => {
  return `${command.method}_${command.commandOptions.endpoint}_${command.cancelable}`;
};
var getCommandKey = (command, useInitialValues) => {
  const methodKey = stringifyKey(command.method);
  const endpointKey = useInitialValues ? command.commandOptions.endpoint : stringifyKey(command.endpoint);
  return `${methodKey}_${endpointKey}`;
};
var getCommandDispatcher = (command, dispatcherType = "auto") => {
  const { fetchDispatcher, submitDispatcher } = command.builder;
  const isGet = command.method === "GET" /* get */;
  const isFetchDispatcher = dispatcherType === "auto" && isGet || dispatcherType === "fetch";
  const dispatcher = isFetchDispatcher ? fetchDispatcher : submitDispatcher;
  return [dispatcher, isFetchDispatcher];
};
var commandSendRequest = (command, dispatcherType = "auto", requestCallback) => {
  const { commandManager } = command.builder;
  const [dispatcher] = getCommandDispatcher(command, dispatcherType);
  return new Promise((resolve) => {
    const requestId = dispatcher.add(command);
    requestCallback == null ? void 0 : requestCallback(requestId, command);
    let unmountResponse = () => void 0;
    let unmountRemoveQueueElement = () => void 0;
    unmountResponse = commandManager.events.onResponseById(requestId, (response, details) => {
      const isOfflineStatus = command.offline && details.isOffline;
      const isFailed = isFailedRequest(response);
      if (isFailed && isOfflineStatus)
        return;
      resolve(response);
      unmountResponse();
      unmountRemoveQueueElement();
    });
    unmountRemoveQueueElement = dispatcher.events.onRemove(requestId, () => {
      resolve([null, getErrorMessage("deleted"), 0]);
      unmountResponse();
      unmountRemoveQueueElement();
    });
  });
};

// src/client/fetch.client.bindings.ts
var getClientBindings = (cmd, requestId) => __async(void 0, null, function* () {
  const { baseUrl, commandManager, loggerManager, headerMapper, payloadMapper } = cmd.builder;
  const logger2 = loggerManager.init("Client");
  let requestStartTimestamp = null;
  let responseStartTimestamp = null;
  let command = cmd;
  let requestTotal = 1;
  let responseTotal = 1;
  let previousRequestTotal = 0;
  let previousResponseTotal = 0;
  logger2.debug(`Starting command middleware callbacks`);
  command = yield command.builder.__modifyRequest(cmd);
  if (command.auth) {
    command = yield command.builder.__modifyAuth(cmd);
  }
  const { builder, abortKey, queueKey, endpoint, data } = command;
  commandManager.addAbortController(abortKey, requestId);
  const fullUrl = baseUrl + endpoint;
  const effects = builder.effects.filter((effect) => command.effectKey === effect.getEffectKey());
  const headers = headerMapper(command);
  const payload = payloadMapper(data);
  const config = getRequestConfig(command);
  const getRequestStartTimestamp = () => {
    return requestStartTimestamp;
  };
  const getResponseStartTimestamp = () => {
    return responseStartTimestamp;
  };
  const getAbortController = () => {
    return commandManager.getAbortController(abortKey, requestId);
  };
  const createAbortListener = (callback) => {
    const controller = getAbortController();
    if (!controller) {
      throw new Error("Controller is not found");
    }
    controller.signal.addEventListener("abort", callback);
    return () => controller.signal.removeEventListener("abort", callback);
  };
  const unmountEmitter = createAbortListener(() => {
    commandManager.events.emitAbort(abortKey, requestId, command);
  });
  const handleRequestProgress = (startTimestamp, progressTimestamp, progressEvent) => {
    const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), progressEvent);
    if (previousRequestTotal !== 100) {
      previousRequestTotal = progress.progress;
      commandManager.events.emitUploadProgress(queueKey, requestId, progress, { requestId, command });
    }
  };
  const handleResponseProgress = (startTimestamp, progressTimestamp, progressEvent) => {
    const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), progressEvent);
    if (previousResponseTotal !== 100) {
      previousResponseTotal = progress.progress;
      commandManager.events.emitDownloadProgress(queueKey, requestId, progress, { requestId, command });
    }
  };
  const onBeforeRequest = () => {
    effects.forEach((effect) => effect.onTrigger(command));
  };
  const onRequestStart = (progress) => {
    effects.forEach((action) => action.onStart(command));
    if (progress == null ? void 0 : progress.total) {
      requestTotal = progress.total;
    }
    const initialPayload = {
      total: requestTotal,
      loaded: (progress == null ? void 0 : progress.loaded) || 0
    };
    requestStartTimestamp = +new Date();
    handleRequestProgress(requestStartTimestamp, requestStartTimestamp, initialPayload);
    commandManager.events.emitRequestStart(queueKey, requestId, { requestId, command });
    return requestStartTimestamp;
  };
  const onRequestProgress = (progress) => {
    if (!requestStartTimestamp) {
      requestStartTimestamp = +new Date();
    }
    requestTotal = progress.total;
    const progressTimestamp = +new Date();
    handleRequestProgress(requestStartTimestamp, progressTimestamp, progress);
    return progressTimestamp;
  };
  const onRequestEnd = () => {
    if (!requestStartTimestamp) {
      requestStartTimestamp = +new Date();
    }
    const progressTimestamp = +new Date();
    handleRequestProgress(requestStartTimestamp, progressTimestamp, {
      total: requestTotal,
      loaded: requestTotal
    });
    return progressTimestamp;
  };
  const onResponseStart = (progress) => {
    responseStartTimestamp = +new Date();
    if (progress == null ? void 0 : progress.total) {
      responseTotal = progress.total;
    }
    const initialPayload = {
      total: responseTotal,
      loaded: (progress == null ? void 0 : progress.loaded) || 0
    };
    handleResponseProgress(responseStartTimestamp, responseStartTimestamp, initialPayload);
    commandManager.events.emitResponseStart(queueKey, requestId, { requestId, command });
    return responseStartTimestamp;
  };
  const onResponseProgress = (progress) => {
    if (!responseStartTimestamp) {
      responseStartTimestamp = +new Date();
    }
    const progressTimestamp = +new Date();
    responseTotal = progress.total;
    handleResponseProgress(responseStartTimestamp, progressTimestamp, progress);
    return progressTimestamp;
  };
  const onResponseEnd = () => {
    if (!responseStartTimestamp) {
      responseStartTimestamp = +new Date();
    }
    const progressTimestamp = +new Date();
    commandManager.removeAbortController(abortKey, requestId);
    handleResponseProgress(responseStartTimestamp, progressTimestamp, {
      total: responseTotal,
      loaded: responseTotal
    });
    unmountEmitter();
    return progressTimestamp;
  };
  const onSuccess = (responseData, status, callback) => __async(void 0, null, function* () {
    let response = [responseData, null, status];
    command.builder.loggerManager.init("Client").http(`Success response`, { response });
    response = yield command.builder.__modifyResponse(response, command);
    response = yield command.builder.__modifySuccessResponse(response, command);
    effects.forEach((effect) => effect.onSuccess(response, command));
    effects.forEach((effect) => effect.onFinished(response, command));
    callback == null ? void 0 : callback(response);
    return response;
  });
  const onError = (error, status, callback) => __async(void 0, null, function* () {
    let responseData = [null, error, status];
    command.builder.loggerManager.init("Client").http(`Error response`, { response: responseData });
    responseData = yield command.builder.__modifyResponse(responseData, command);
    responseData = yield command.builder.__modifyErrorResponse(responseData, command);
    effects.forEach((effect) => effect.onError(responseData, command));
    effects.forEach((effect) => effect.onFinished(responseData, command));
    callback == null ? void 0 : callback(responseData);
    return responseData;
  });
  const onAbortError = () => __async(void 0, null, function* () {
    const error = getErrorMessage("abort");
    return onError(error, 0);
  });
  const onTimeoutError = () => __async(void 0, null, function* () {
    const error = getErrorMessage("timeout");
    return onError(error, 0);
  });
  const onUnexpectedError = () => __async(void 0, null, function* () {
    const error = getErrorMessage();
    return onError(error, 0);
  });
  return {
    fullUrl,
    headers,
    payload,
    config,
    getAbortController,
    getRequestStartTimestamp,
    getResponseStartTimestamp,
    createAbortListener,
    onBeforeRequest,
    onRequestStart,
    onRequestProgress,
    onRequestEnd,
    onResponseStart,
    onResponseProgress,
    onResponseEnd,
    onSuccess,
    onAbortError,
    onTimeoutError,
    onUnexpectedError,
    onError
  };
});

// src/client/fetch.client.constants.ts
var defaultTimeout = 1e3 /* second */ * 5;

// src/cache/cache.ts
import EventEmitter2 from "events";
var Cache = class {
  constructor(builder, options) {
    this.builder = builder;
    this.options = options;
    this.emitter = new EventEmitter2();
    this.set = (command, response, details) => {
      const { cacheKey, cache, cacheTime } = command;
      const cachedData = this.storage.get(cacheKey);
      const data = getCacheData(cachedData == null ? void 0 : cachedData.data, response);
      const newCacheData = { data, details, cacheTime };
      this.events.set(cacheKey, newCacheData);
      if (!cache) {
        return;
      }
      if (!details.isFailed) {
        this.storage.set(cacheKey, newCacheData);
      }
    };
    this.get = (cacheKey) => {
      const cachedData = this.storage.get(cacheKey);
      return cachedData;
    };
    this.keys = () => {
      const values = this.storage.keys();
      return Array.from(values);
    };
    this.delete = (cacheKey) => {
      this.events.revalidate(cacheKey);
      this.storage.delete(cacheKey);
    };
    this.clear = () => {
      this.storage.clear();
    };
    var _a, _b, _c;
    this.storage = ((_a = this.options) == null ? void 0 : _a.storage) || /* @__PURE__ */ new Map();
    this.events = getCacheEvents(this.emitter, this.storage);
    (_c = (_b = this.options) == null ? void 0 : _b.onInitialization) == null ? void 0 : _c.call(_b, this);
  }
};

// src/cache/cache.utils.ts
var getCacheData = (previousResponse, response) => {
  const isFailed = isFailedRequest(response);
  const previousData = isFailed && previousResponse ? previousResponse[0] : null;
  const data = response[0] || previousData;
  const error = response[1];
  const status = response[2];
  return [data, error, status];
};
var getRevalidateEventKey = (key) => {
  return `${key}_revalidate`;
};
var getCacheKey = (key) => {
  return `${key}_cache`;
};
var getCacheIdKey = (key) => {
  return `${key}_cache_by_id`;
};

// src/cache/cache.events.ts
var getCacheEvents = (emitter, storage) => ({
  set: (cacheKey, data) => {
    emitter.emit(getCacheKey(cacheKey), data);
  },
  revalidate: (cacheKey) => {
    const keys = storage.keys();
    if (typeof cacheKey === "string") {
      emitter.emit(getRevalidateEventKey(cacheKey));
    } else {
      for (const entityKey of keys) {
        if (cacheKey.test(entityKey)) {
          emitter.emit(getRevalidateEventKey(entityKey));
        }
      }
    }
  },
  get: (cacheKey, callback) => {
    emitter.on(getCacheKey(cacheKey), callback);
    return () => emitter.removeListener(getCacheKey(cacheKey), callback);
  },
  onRevalidate: (cacheKey, callback) => {
    emitter.on(getRevalidateEventKey(cacheKey), callback);
    return () => emitter.removeListener(getRevalidateEventKey(cacheKey), callback);
  }
});

// src/managers/app/app.manager.ts
import EventEmitter3 from "events";
var AppManager = class {
  constructor(builder, options) {
    this.builder = builder;
    this.options = options;
    this.emitter = new EventEmitter3();
    this.events = getAppManagerEvents(this.emitter);
    this.setInitialFocus = (initValue) => __async(this, null, function* () {
      if (typeof initValue === "function") {
        this.isFocused = false;
        this.isFocused = yield initValue();
      } else {
        this.isFocused = initValue;
      }
    });
    this.setInitialOnline = (initValue) => __async(this, null, function* () {
      if (typeof initValue === "function") {
        this.isOnline = false;
        this.isOnline = yield initValue();
      } else {
        this.isOnline = initValue;
      }
    });
    this.setFocused = (isFocused) => {
      this.isFocused = isFocused;
      if (isFocused) {
        this.events.emitFocus();
      } else {
        this.events.emitBlur();
      }
    };
    this.setOnline = (isOnline) => {
      this.isOnline = isOnline;
      if (isOnline) {
        this.events.emitOnline();
      } else {
        this.events.emitOffline();
      }
    };
    const {
      focusEvent = appManagerInitialOptions.focusEvent,
      onlineEvent = appManagerInitialOptions.onlineEvent,
      initiallyFocused = appManagerInitialOptions.initiallyFocused,
      initiallyOnline = appManagerInitialOptions.initiallyOnline
    } = this.options || appManagerInitialOptions;
    this.setInitialFocus(initiallyFocused);
    this.setInitialOnline(initiallyOnline);
    focusEvent(this.setFocused);
    onlineEvent(this.setOnline);
  }
};

// src/managers/app/app.manager.utils.ts
var hasWindow = () => {
  return Boolean(window && window.addEventListener);
};
var hasDocument = () => {
  return Boolean(hasWindow() && window.document && window.document.addEventListener);
};
var onWindowEvent = (key, listener, options) => {
  if (hasWindow()) {
    window.addEventListener(key, listener, options);
  }
};
var onDocumentEvent = (key, listener, options) => {
  if (hasDocument()) {
    window.document.addEventListener(key, listener, options);
  }
};

// src/managers/app/app.manager.events.ts
var getAppManagerEvents = (emitter) => ({
  emitFocus: () => {
    emitter.emit("focus" /* focus */);
  },
  emitBlur: () => {
    emitter.emit("blur" /* blur */);
  },
  emitOnline: () => {
    emitter.emit("online" /* online */);
  },
  emitOffline: () => {
    emitter.emit("offline" /* offline */);
  },
  onFocus: (callback) => {
    emitter.on("focus" /* focus */, callback);
    return () => emitter.removeListener("focus" /* focus */, callback);
  },
  onBlur: (callback) => {
    emitter.on("blur" /* blur */, callback);
    return () => emitter.removeListener("blur" /* blur */, callback);
  },
  onOnline: (callback) => {
    emitter.on("online" /* online */, callback);
    return () => emitter.removeListener("online" /* online */, callback);
  },
  onOffline: (callback) => {
    emitter.on("offline" /* offline */, callback);
    return () => emitter.removeListener("offline" /* offline */, callback);
  }
});

// src/managers/app/app.manager.constants.ts
var AppEvents = /* @__PURE__ */ ((AppEvents2) => {
  AppEvents2["focus"] = "focus";
  AppEvents2["blur"] = "blur";
  AppEvents2["online"] = "online";
  AppEvents2["offline"] = "offline";
  return AppEvents2;
})(AppEvents || {});
var appManagerInitialOptions = {
  initiallyFocused: true,
  initiallyOnline: true,
  focusEvent: (setFocused) => {
    onDocumentEvent("visibilitychange", () => setFocused(true));
    onWindowEvent("focus", () => setFocused(true));
    onWindowEvent("blur", () => setFocused(false));
  },
  onlineEvent: (setOnline) => {
    onWindowEvent("online", () => setOnline(true));
    onWindowEvent("offline", () => setOnline(false));
  }
};

// src/managers/command/command.manager.ts
import EventEmitter4 from "events";
var CommandManager = class {
  constructor() {
    this.emitter = new EventEmitter4();
    this.events = getCommandManagerEvents(this.emitter);
    this.abortControllers = /* @__PURE__ */ new Map();
    this.addAbortController = (abortKey, requestId) => {
      let abortGroup = this.abortControllers.get(abortKey);
      if (!abortGroup) {
        const newAbortGroup = /* @__PURE__ */ new Map();
        abortGroup = newAbortGroup;
        this.abortControllers.set(abortKey, newAbortGroup);
      }
      const abortController = abortGroup.get(requestId);
      if (!abortController || abortController.signal.aborted) {
        abortGroup.set(requestId, new AbortController());
      }
    };
    this.getAbortController = (abortKey, requestId) => {
      var _a;
      return (_a = this.abortControllers.get(abortKey)) == null ? void 0 : _a.get(requestId);
    };
    this.removeAbortController = (abortKey, requestId) => {
      var _a;
      (_a = this.abortControllers.get(abortKey)) == null ? void 0 : _a.delete(requestId);
    };
    this.useAbortController = (abortKey, requestId) => {
      var _a;
      const controller = (_a = this.abortControllers.get(abortKey)) == null ? void 0 : _a.get(requestId);
      controller == null ? void 0 : controller.abort();
    };
    this.abortByKey = (abortKey) => {
      const controllers = this.abortControllers.get(abortKey);
      if (controllers) {
        const entries = Array.from(controllers.entries());
        entries.forEach(([key]) => {
          this.useAbortController(abortKey, key);
        });
      }
    };
    this.abortByRequestId = (abortKey, requestId) => {
      this.useAbortController(abortKey, requestId);
    };
    this.abortAll = () => {
      const entries = Array.from(this.abortControllers.entries()) || [];
      entries.forEach(([abortKey, value]) => {
        const controllers = Array.from(value.entries()) || [];
        controllers.forEach(([requestId]) => {
          this.useAbortController(abortKey, requestId);
        });
      });
    };
  }
};

// src/managers/command/command.manager.utils.ts
var getAbortEventKey = (key) => `${key}-request-abort`;
var getAbortByIdEventKey = (key) => `${key}-request-abort-by-id`;
var getResponseEventKey = (key) => `${key}-response`;
var getResponseIdEventKey = (key) => `${key}-response-by-id`;
var getRequestStartEventKey = (key) => `${key}-request-start`;
var getRequestStartIdEventKey = (key) => `${key}-request-start-by-id`;
var getResponseStartEventKey = (key) => `${key}-response-start`;
var getResponseStartIdEventKey = (key) => `${key}-response-start-by-id`;
var getUploadProgressEventKey = (key) => `${key}-request-progress`;
var getUploadProgressIdEventKey = (key) => `${key}-request-progress-by-id`;
var getDownloadProgressEventKey = (key) => `${key}-response-progress`;
var getDownloadProgressIdEventKey = (key) => `${key}-response-progress-by-id`;

// src/managers/command/command.manager.events.ts
var getCommandManagerEvents = (emitter) => ({
  emitRequestStart: (queueKey, requestId, details) => {
    emitter.emit(getRequestStartIdEventKey(requestId), details);
    emitter.emit(getRequestStartEventKey(queueKey), details);
  },
  emitResponseStart: (queueKey, requestId, details) => {
    emitter.emit(getResponseStartIdEventKey(requestId), details);
    emitter.emit(getResponseStartEventKey(queueKey), details);
  },
  emitUploadProgress: (queueKey, requestId, values, details) => {
    emitter.emit(getUploadProgressIdEventKey(requestId), values, details);
    emitter.emit(getUploadProgressEventKey(queueKey), values, details);
  },
  emitDownloadProgress: (queueKey, requestId, values, details) => {
    emitter.emit(getDownloadProgressIdEventKey(requestId), values, details);
    emitter.emit(getDownloadProgressEventKey(queueKey), values, details);
  },
  emitResponse: (cacheKey, requestId, response, details) => {
    emitter.emit(getResponseIdEventKey(requestId), response, details);
    emitter.emit(getResponseEventKey(cacheKey), response, details);
  },
  emitAbort: (abortKey, requestId, command) => {
    emitter.emit(getAbortByIdEventKey(requestId), command);
    emitter.emit(getAbortEventKey(abortKey), command);
  },
  onRequestStart: (queueKey, callback) => {
    emitter.on(getRequestStartEventKey(queueKey), callback);
    return () => emitter.removeListener(getRequestStartEventKey(queueKey), callback);
  },
  onRequestStartById: (requestId, callback) => {
    emitter.on(getRequestStartIdEventKey(requestId), callback);
    return () => emitter.removeListener(getRequestStartIdEventKey(requestId), callback);
  },
  onResponseStart: (queueKey, callback) => {
    emitter.on(getResponseStartEventKey(queueKey), callback);
    return () => emitter.removeListener(getResponseStartEventKey(queueKey), callback);
  },
  onResponseStartById: (requestId, callback) => {
    emitter.on(getResponseStartIdEventKey(requestId), callback);
    return () => emitter.removeListener(getResponseStartIdEventKey(requestId), callback);
  },
  onUploadProgress: (queueKey, callback) => {
    emitter.on(getUploadProgressEventKey(queueKey), callback);
    return () => emitter.removeListener(getUploadProgressEventKey(queueKey), callback);
  },
  onUploadProgressById: (requestId, callback) => {
    emitter.on(getUploadProgressIdEventKey(requestId), callback);
    return () => emitter.removeListener(getUploadProgressIdEventKey(requestId), callback);
  },
  onDownloadProgress: (queueKey, callback) => {
    emitter.on(getDownloadProgressEventKey(queueKey), callback);
    return () => emitter.removeListener(getDownloadProgressEventKey(queueKey), callback);
  },
  onDownloadProgressById: (requestId, callback) => {
    emitter.on(getDownloadProgressIdEventKey(requestId), callback);
    return () => emitter.removeListener(getDownloadProgressIdEventKey(requestId), callback);
  },
  onResponse: (queueKey, callback) => {
    emitter.on(getResponseEventKey(queueKey), callback);
    return () => emitter.removeListener(getResponseEventKey(queueKey), callback);
  },
  onResponseById: (requestId, callback) => {
    emitter.on(getResponseIdEventKey(requestId), callback);
    return () => emitter.removeListener(getResponseIdEventKey(requestId), callback);
  },
  onAbort: (abortKey, callback) => {
    emitter.on(getAbortEventKey(abortKey), callback);
    return () => emitter.removeListener(getAbortEventKey(abortKey), callback);
  },
  onAbortById: (requestId, callback) => {
    emitter.on(getAbortByIdEventKey(requestId), callback);
    return () => emitter.removeListener(getAbortByIdEventKey(requestId), callback);
  }
});

// src/managers/logger/logger.manager.ts
var LoggerManager = class {
  constructor(builder, options) {
    this.builder = builder;
    this.options = options;
    this.setLevels = (levels) => {
      this.levels = levels;
    };
    this.init = (module) => {
      return {
        success: (message, ...additionalData) => {
          if (!this.builder.debug || !this.levels.includes("success"))
            return;
          this.logger({ level: "success", module, message, additionalData });
        },
        error: (message, ...additionalData) => {
          if (!this.builder.debug || !this.levels.includes("error"))
            return;
          this.logger({ level: "error", module, message, additionalData });
        },
        warning: (message, ...additionalData) => {
          if (!this.builder.debug || !this.levels.includes("warning"))
            return;
          this.logger({ level: "warning", module, message, additionalData });
        },
        http: (message, ...additionalData) => {
          if (!this.builder.debug || !this.levels.includes("http"))
            return;
          this.logger({ level: "http", module, message, additionalData });
        },
        info: (message, ...additionalData) => {
          if (!this.builder.debug || !this.levels.includes("info"))
            return;
          this.logger({ level: "info", module, message, additionalData });
        },
        debug: (message, ...additionalData) => {
          if (!this.builder.debug || !this.levels.includes("debug"))
            return;
          this.logger({ level: "debug", module, message, additionalData });
        }
      };
    };
    var _a, _b;
    this.logger = ((_a = this.options) == null ? void 0 : _a.logger) || logger;
    this.levels = ((_b = this.options) == null ? void 0 : _b.levels) || ["error", "success", "warning", "http", "info"];
  }
};

// src/managers/logger/logger.manager.utils.ts
var getTime = () => {
  const d = new Date();
  return `${d.toLocaleTimeString()}(:${d.getMilliseconds()})`;
};
var logger = (log) => {
  var _a;
  const styles = loggerStyles[log.level];
  const emoji = loggerIconLevels[log.level];
  const module = `%c[${log.module}]:[${getTime()}]:`;
  const message = `${emoji}${module} ${log.message}`;
  if ((_a = log.additionalData) == null ? void 0 : _a.length) {
    console.groupCollapsed(message, styles);
    log.additionalData.forEach((data) => {
      console.log(data);
    });
    console.groupEnd();
  } else {
    console.log(message, styles);
  }
};

// src/managers/logger/logger.manager.constants.ts
var defaultStyles = "background:rgba(0,0,0,0.2);padding:2px 5px;border-radius:5px;font-weight:bold;";
var loggerStyles = {
  success: `${defaultStyles}color:#24b150`,
  error: `${defaultStyles}color:#db2525`,
  warning: `${defaultStyles}color:#e1941e`,
  http: `${defaultStyles}color:#c743cf`,
  info: `${defaultStyles}color:#1e74e1`,
  debug: `${defaultStyles}color:#adadad`
};
var loggerIconLevels = {
  success: `\u2705`,
  error: `\u{1F6A8}`,
  warning: `\u{1F6A7}`,
  http: `\u{1F680}`,
  info: `\u2139\uFE0F`,
  debug: `\u{1F6E9}\uFE0F`
};

// src/builder/builder.ts
var Builder = class {
  constructor(options) {
    this.options = options;
    this.__onErrorCallbacks = [];
    this.__onSuccessCallbacks = [];
    this.__onResponseCallbacks = [];
    this.__onAuthCallbacks = [];
    this.__onRequestCallbacks = [];
    this.commandManager = new CommandManager();
    this.loggerManager = new LoggerManager(this);
    this.effects = [];
    this.stringifyQueryParams = (queryParams) => stringifyQueryParams(queryParams, this.queryParamsConfig);
    this.headerMapper = getClientHeaders;
    this.payloadMapper = getClientPayload;
    this.logger = this.loggerManager.init("Builder");
    this.setRequestConfig = (requestConfig) => {
      this.requestConfig = requestConfig;
      return this;
    };
    this.setCommandConfig = (commandConfig) => {
      this.commandConfig = commandConfig;
      return this;
    };
    this.setDebug = (debug) => {
      this.debug = debug;
      return this;
    };
    this.setLoggerLevel = (levels) => {
      this.loggerManager.setLevels(levels);
      return this;
    };
    this.setLogger = (callback) => {
      this.loggerManager = callback(this);
      return this;
    };
    this.setQueryParamsConfig = (queryParamsConfig) => {
      this.queryParamsConfig = queryParamsConfig;
      return this;
    };
    this.setStringifyQueryParams = (stringifyFn) => {
      this.stringifyQueryParams = stringifyFn;
      return this;
    };
    this.setHeaderMapper = (headerMapper) => {
      this.headerMapper = headerMapper;
      return this;
    };
    this.setPayloadMapper = (payloadMapper) => {
      this.payloadMapper = payloadMapper;
      return this;
    };
    this.setClient = (callback) => {
      this.client = callback(this);
      return this;
    };
    this.onAuth = (callback) => {
      this.__onAuthCallbacks.push(callback);
      return this;
    };
    this.onError = (callback) => {
      this.__onErrorCallbacks.push(callback);
      return this;
    };
    this.onSuccess = (callback) => {
      this.__onSuccessCallbacks.push(callback);
      return this;
    };
    this.onRequest = (callback) => {
      this.__onRequestCallbacks.push(callback);
      return this;
    };
    this.onResponse = (callback) => {
      this.__onResponseCallbacks.push(callback);
      return this;
    };
    this.addEffect = (effect) => {
      this.effects = this.effects.concat(effect);
      return this;
    };
    this.removeEffect = (effect) => {
      const name = typeof effect === "string" ? effect : effect.getEffectKey();
      this.effects = this.effects.filter((currentEffect) => currentEffect.getEffectKey() !== name);
      return this;
    };
    this.createCommand = () => {
      return (params) => new Command(this, params);
    };
    this.clear = () => {
      const { appManager, cache, fetchDispatcher, submitDispatcher } = this.options;
      this.commandManager.abortControllers.clear();
      this.fetchDispatcher.clear();
      this.submitDispatcher.clear();
      this.cache.clear();
      this.commandManager.emitter.removeAllListeners();
      this.fetchDispatcher.emitter.removeAllListeners();
      this.submitDispatcher.emitter.removeAllListeners();
      this.cache.emitter.removeAllListeners();
      this.appManager = (appManager == null ? void 0 : appManager(this)) || new AppManager(this);
      this.cache = (cache == null ? void 0 : cache(this)) || new Cache(this);
      this.fetchDispatcher = (fetchDispatcher == null ? void 0 : fetchDispatcher(this)) || new Dispatcher(this);
      this.submitDispatcher = (submitDispatcher == null ? void 0 : submitDispatcher(this)) || new Dispatcher(this);
    };
    this.__modifyAuth = (command) => __async(this, null, function* () {
      let newCommand = command;
      if (!command.commandOptions.disableRequestInterceptors) {
        for (const interceptor of this.__onAuthCallbacks) {
          newCommand = yield interceptor(command);
          if (!newCommand)
            throw new Error("Auth request modifier must return command");
        }
      }
      return newCommand;
    });
    this.__modifyRequest = (command) => __async(this, null, function* () {
      let newCommand = command;
      if (!command.commandOptions.disableRequestInterceptors) {
        for (const interceptor of this.__onRequestCallbacks) {
          newCommand = yield interceptor(command);
          if (!newCommand)
            throw new Error("Request modifier must return command");
        }
      }
      return newCommand;
    });
    this.__modifyErrorResponse = (response, command) => __async(this, null, function* () {
      let newResponse = response;
      if (!command.commandOptions.disableResponseInterceptors) {
        for (const interceptor of this.__onErrorCallbacks) {
          newResponse = yield interceptor(response, command);
          if (!newResponse)
            throw new Error("Response modifier must return data");
        }
      }
      return newResponse;
    });
    this.__modifySuccessResponse = (response, command) => __async(this, null, function* () {
      let newResponse = response;
      if (!command.commandOptions.disableResponseInterceptors) {
        for (const interceptor of this.__onSuccessCallbacks) {
          newResponse = yield interceptor(response, command);
          if (!newResponse)
            throw new Error("Response modifier must return data");
        }
      }
      return newResponse;
    });
    this.__modifyResponse = (response, command) => __async(this, null, function* () {
      let newResponse = response;
      if (!command.commandOptions.disableResponseInterceptors) {
        for (const interceptor of this.__onResponseCallbacks) {
          newResponse = yield interceptor(response, command);
          if (!newResponse)
            throw new Error("Response modifier must return data");
        }
      }
      return newResponse;
    });
    const { baseUrl, client, appManager, cache, fetchDispatcher, submitDispatcher } = this.options;
    this.baseUrl = baseUrl;
    this.client = client || fetchClient;
    this.appManager = (appManager == null ? void 0 : appManager(this)) || new AppManager(this);
    this.cache = (cache == null ? void 0 : cache(this)) || new Cache(this);
    this.fetchDispatcher = (fetchDispatcher == null ? void 0 : fetchDispatcher(this)) || new Dispatcher(this);
    this.submitDispatcher = (submitDispatcher == null ? void 0 : submitDispatcher(this)) || new Dispatcher(this);
  }
};

// src/builder/builder.utils.ts
var stringifyValue = (response) => {
  try {
    return JSON.stringify(response);
  } catch (err) {
    return "";
  }
};
var getClientHeaders = (command) => {
  const isFormData = command.data instanceof FormData;
  const headers = {};
  if (!isFormData)
    headers["Content-Type"] = "application/json";
  Object.assign(headers, command.headers);
  return headers;
};
var getClientPayload = (data) => {
  const isFormData = data instanceof FormData;
  if (isFormData)
    return data;
  return stringifyValue(data);
};
var isValidValue = (options) => {
  return (value) => {
    const { skipNull, skipEmptyString } = options;
    if (skipEmptyString && value === void 0) {
      return false;
    }
    if (skipEmptyString && value === "") {
      return false;
    }
    if (skipNull && value === null) {
      return false;
    }
    return true;
  };
};
var encodeValue = (value, { encode, strict }) => {
  if (encode && strict) {
    return encodeURIComponent(value).replace(/[!'()*]/g, (s) => `%${s.charCodeAt(0).toString(16).toUpperCase()}`);
  }
  if (encode) {
    return encodeURIComponent(value);
  }
  return value;
};
var encodeParams = (key, value, options) => {
  const shouldSkip = !isValidValue(options)(value);
  if (!key || shouldSkip) {
    return "";
  }
  return `${encodeValue(key, options)}=${encodeValue(String(value), options)}`;
};
var encodeArray = (key, array, options) => {
  const { arrayFormat, arraySeparator } = options;
  return array.filter(isValidValue(options)).reduce((acc, value, index) => {
    switch (arrayFormat) {
      case "index": {
        const keyValue = `${encodeValue(key, options)}[${encodeValue(String(index), options)}]=`;
        acc.push(`${keyValue}${encodeValue(String(value), options)}`);
        break;
      }
      case "bracket": {
        const keyValue = `${encodeValue(key, options)}[]=`;
        acc.push(`${keyValue}${encodeValue(String(value), options)}`);
        break;
      }
      case "comma": {
        const keyValue = !acc.length && `${encodeValue(key, options)}=` || "";
        return [[...acc, `${keyValue}${encodeValue(String(value), options)}`].join(",")];
      }
      case "separator": {
        const keyValue = !acc.length && `${encodeValue(key, options)}=` || "";
        return [[...acc, `${keyValue}${encodeValue(String(value), options)}`].join(arraySeparator || "|")];
      }
      case "bracket-separator": {
        const keyValue = !acc.length && `${encodeValue(key, options)}[]=` || "";
        return [[...acc, `${keyValue}${encodeValue(String(value), options)}`].join(arraySeparator || "|")];
      }
      default: {
        const keyValue = `${encodeValue(key, options)}=`;
        acc.push(`${keyValue}${encodeValue(String(value), options)}`);
      }
    }
    return acc;
  }, []).join("&");
};
var stringifyQueryParams = (queryParams, options = stringifyDefaultOptions) => {
  if (!queryParams || !Object.keys(queryParams).length) {
    return "";
  }
  if (typeof queryParams === "string") {
    const hasQuestionMark = queryParams[0] === "?";
    return hasQuestionMark ? queryParams : `?${queryParams}`;
  }
  const stringified = Object.entries(queryParams).map(([key, value]) => {
    if (Array.isArray(value)) {
      return encodeArray(key, value, options);
    }
    return encodeParams(key, value, options);
  }).filter(Boolean).join("&");
  if (stringified) {
    return `?${stringified}`;
  }
  return "";
};

// src/builder/builder.constants.ts
var stringifyDefaultOptions = {
  strict: true,
  encode: true,
  arrayFormat: "bracket",
  arraySeparator: "",
  sort: false,
  skipNull: true,
  skipEmptyString: true
};
export {
  AppEvents,
  AppManager,
  Builder,
  Cache,
  Command,
  CommandManager,
  DateInterval,
  Dispatcher,
  DispatcherRequestType,
  FetchEffect,
  HttpMethodsEnum,
  LoggerManager,
  appManagerInitialOptions,
  canRetryRequest,
  commandSendRequest,
  defaultTimeout,
  fetchClient,
  getAbortByIdEventKey,
  getAbortEventKey,
  getAppManagerEvents,
  getCacheData,
  getCacheEvents,
  getCacheIdKey,
  getCacheKey,
  getClientBindings,
  getClientHeaders,
  getClientPayload,
  getCommandDispatcher,
  getCommandKey,
  getCommandManagerEvents,
  getDispatcherChangeEventKey,
  getDispatcherDrainedEventKey,
  getDispatcherEvents,
  getDispatcherLoadingEventKey,
  getDispatcherLoadingIdEventKey,
  getDispatcherRemoveEventKey,
  getDispatcherStatusEventKey,
  getDownloadProgressEventKey,
  getDownloadProgressIdEventKey,
  getErrorMessage,
  getIsEqualTimestamp,
  getProgressData,
  getProgressValue,
  getRequestConfig,
  getRequestEta,
  getRequestStartEventKey,
  getRequestStartIdEventKey,
  getRequestType,
  getResponseEventKey,
  getResponseIdEventKey,
  getResponseStartEventKey,
  getResponseStartIdEventKey,
  getRevalidateEventKey,
  getSimpleKey,
  getUploadProgressEventKey,
  getUploadProgressIdEventKey,
  handleError,
  handleProgress,
  handleReadyStateChange,
  hasDocument,
  hasWindow,
  isFailedRequest,
  logger,
  loggerIconLevels,
  loggerStyles,
  onDocumentEvent,
  onWindowEvent,
  parseErrorResponse,
  parseResponse,
  stringifyDefaultOptions,
  stringifyKey,
  stringifyQueryParams,
  stringifyValue
};
