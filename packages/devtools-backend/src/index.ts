import { ClientInstance } from "@hyper-fetch/core";

import { DevtoolsQueueStats } from "devtools.stats";
import { DevtoolsRequestEvent } from "devtools.types";

export class BackendDevtools {
  client: ClientInstance;
  queueStats: DevtoolsQueueStats;
  requests: DevtoolsRequestEvent[] = [];
  constructor(client: ClientInstance) {
    this.client = client;
    this.queueStats = new DevtoolsQueueStats();
  }

  unmountOnRequestStart = () => {
    return this.client.requestManager.events.onRequestStart((details) => {
      this.requests.push({ ...details, triggerTimestamp: new Date() } as DevtoolsRequestEvent);
      // setLoadingKeys((prev) => prev.filter((i) => i !== details.request.cacheKey));
      this.queueStats.updateQueuesGeneralInfo(this.client);
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
    });
  };
}
