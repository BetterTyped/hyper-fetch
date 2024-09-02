import { ClientInstance } from "@hyper-fetch/core";
import { Emitter, Socket } from "@hyper-fetch/sockets";

import { DevtoolsQueueStats } from "devtools.stats";
import { DevtoolsCacheEvent, DevtoolsPluginOptions, DevtoolsRequestEvent, MessageType } from "devtools.types";

export class DevtoolsManager {
  client: ClientInstance;
  socket: Socket;
  socketEmitter: Emitter<MessageType, any, any>;
  queueStats: DevtoolsQueueStats;
  requests: DevtoolsRequestEvent[] = [];
  cache: DevtoolsCacheEvent[] = [];
  unmountHooks: any;

  static initialize(client: ClientInstance, pluginOptions: DevtoolsPluginOptions): DevtoolsManager {
    return new DevtoolsManager(client, pluginOptions);
  }

  constructor(
    client: ClientInstance,
    { socketAddress = "ws://localhost", socketPort = 1234, appName }: DevtoolsPluginOptions,
  ) {
    this.client = client;
    this.unmountHooks = this.initializeHooks();
    this.queueStats = new DevtoolsQueueStats();
    this.socket = new Socket({ url: `${socketAddress}:${socketPort}` }).setQuery({
      connectionName: `HF_DEVTOOLS_CLIENT_${appName}}`,
    });
    this.socketEmitter = this.socket.createEmitter<MessageType>()({ topic: "DEVTOOLS_CLIENT_EMITTER_TOPIC" });
  }

  sendData = () => {
    this.socketEmitter.emit({
      data: {
        requestsMap: [...this.client.__requestsMap.values()],
        requests: this.requests,
        failed: this.queueStats.requestsFailed,
        success: this.queueStats.requestsSucceeded,
        inProgress: this.queueStats.requestsInProgress,
        paused: this.queueStats.requestsPaused,
        canceled: this.queueStats.requestsCancelled,
        removed: this.queueStats.requestsRemoved,
        queues: this.queueStats.queuesInfo,
        stats: this.queueStats.stats,
        cache: this.cache,
      },
    });
  };

  initializeHooks = () => {
    return {
      unmountOnRequestStart: this.unmountOnRequestStart(),
      unmountOnResponse: this.unmountOnResponse(),
      unmountOnRequestPause: this.unmountOnRequestPause(),
      unmountOnFetchQueueChange: this.unmountOnFetchQueueChange(),
      unmountOnFetchQueueStatusChange: this.unmountOnFetchQueueStatusChange(),
      unmountOnSubmitQueueChange: this.unmountOnSubmitQueueChange(),
      unmountOnSubmitQueueStatusChange: this.unmountOnSubmitQueueStatusChange(),
      unmountOnRemove: this.unmountOnRemove(),
      unmountOnCacheChange: this.unmountOnCacheChange(),
      unmountOnCacheInvalidate: this.unmountOnCacheInvalidate(),
      unmountCacheDelete: this.unmountCacheDelete(),
    };
  };

  handleCacheChange = () => {
    const cacheKeys = [...this.client.cache.storage.keys()];

    return cacheKeys
      .map((key) => {
        const data = this.client.cache.get(key);

        return {
          cacheKey: key,
          cacheData: data,
        };
      })
      .filter(({ cacheData }) => !!cacheData) as DevtoolsCacheEvent[];
  };

  unmountOnRequestStart = () => {
    return this.client.requestManager.events.onRequestStart((details) => {
      this.requests.push({ ...details, triggerTimestamp: new Date() } as DevtoolsRequestEvent);
      this.queueStats.updateQueuesGeneralInfo(this.client);
      this.sendData();
    });
  };
  unmountOnResponse = () => {
    return this.client.requestManager.events.onResponse(({ response, details, request, requestId }) => {
      this.queueStats.updateQueuesGeneralInfo(this.client);

      if (!details.isCanceled) {
        this.queueStats.update(request, response, details);
      }

      if (response.success) {
        this.queueStats.addSuccessRequest({ requestId, details, response });
      } else if (!details.isCanceled) {
        this.queueStats.addFailedRequest({ requestId, details, response });
      }
      this.sendData();
    });
  };
  unmountOnRequestPause = () => {
    return this.client.requestManager.events.onAbort(({ requestId, request }) => {
      this.queueStats.addCancelledRequest({ requestId, request });
      this.queueStats.updateQueuesGeneralInfo(this.client);
      this.sendData();
    });
  };
  unmountOnFetchQueueChange = () => {
    return this.client.fetchDispatcher.events.onQueueChange(() => {
      this.queueStats.updateQueuesGeneralInfo(this.client);
      this.sendData();
    });
  };
  unmountOnFetchQueueStatusChange = () => {
    return this.client.fetchDispatcher.events.onQueueStatusChange(() => {
      this.queueStats.updateQueuesGeneralInfo(this.client);
      this.sendData();
    });
  };
  unmountOnSubmitQueueChange = () => {
    return this.client.submitDispatcher.events.onQueueChange(() => {
      this.queueStats.updateQueuesGeneralInfo(this.client);
      this.sendData();
    });
  };
  unmountOnSubmitQueueStatusChange = () => {
    return this.client.submitDispatcher.events.onQueueStatusChange(() => {
      this.queueStats.updateQueuesGeneralInfo(this.client);
      this.sendData();
    });
  };
  unmountOnRemove = () => {
    return this.client.requestManager.events.onRemove(({ requestId, request, resolved }) => {
      if (!resolved) {
        return this.queueStats.addRemovedRequest({ request, requestId });
      }
      this.queueStats.updateQueuesGeneralInfo(this.client);
      this.sendData();
    });
  };
  unmountOnCacheChange = () => {
    return this.client.cache.events.onData(() => {
      this.cache = this.handleCacheChange();
      this.sendData();
    });
  };
  unmountOnCacheInvalidate = () => {
    return this.client.cache.events.onInvalidate(() => {
      this.cache = this.handleCacheChange();
      this.sendData();
    });
  };

  unmountCacheDelete = () => {
    return this.client.cache.events.onDelete(() => {
      this.cache = this.handleCacheChange();
      this.sendData();
    });
  };

  unmountHooksFromClient = () => {
    this.unmountHooks.unmountOnRequestStart();
    this.unmountHooks.unmountOnResponse();
    this.unmountHooks.unmountOnRequestPause();
    this.unmountHooks.unmountOnFetchQueueChange();
    this.unmountHooks.unmountOnFetchQueueStatusChange();
    this.unmountHooks.unmountOnSubmitQueueChange();
    this.unmountHooks.unmountOnSubmitQueueStatusChange();
    this.unmountHooks.unmountOnRemove();
    this.unmountHooks.unmountOnCacheChange();
    this.unmountHooks.unmountOnCacheInvalidate();
    this.unmountHooks.unmountCacheDelete();
  };
}
