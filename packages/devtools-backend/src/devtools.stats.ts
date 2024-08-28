import {
  RequestInstance,
  Response,
  ResponseDetailsType,
  QueueDataType,
  ClientInstance,
  ResponseType,
} from "@hyper-fetch/core";

import { DevtoolsRequestQueueStats, DevtoolsElement, DevtoolsRequestResponse } from "./devtools.types";

const DEFAULT_REQUEST_QUEUE_STATS: DevtoolsRequestQueueStats = {
  total: 0,
  success: 0,
  failed: 0,
  canceled: 0,
  avgTime: 0,
  minTime: 0,
  maxTime: 0,
  lastTime: 0,
  avgQueueTime: 0,
  minQueueTime: 0,
  maxQueueTime: 0,
  lastQueueTime: 0,
  avgProcessingTime: 0,
  minProcessingTime: 0,
  maxProcessingTime: 0,
  lastProcessingTime: 0,
};

export class DevtoolsQueueStats {
  stats: Record<string, DevtoolsRequestQueueStats> = {};
  requestsInProgress: DevtoolsElement[] = [];
  requestsPaused: DevtoolsElement[] = [];
  requestsSucceeded: DevtoolsRequestResponse[] = [];
  requestsFailed: DevtoolsRequestResponse[] = [];
  requestsAborted: DevtoolsElement[] = [];
  queuesInfo: QueueDataType[] = [];

  update(request: RequestInstance, response: Response<RequestInstance>, details: ResponseDetailsType) {
    const { queueKey } = request;
    const currentQueueStats = this.stats[queueKey] || DEFAULT_REQUEST_QUEUE_STATS;

    const reqTime = details.responseTimestamp - response.requestTimestamp;
    const processTime = details.requestTimestamp - details.triggerTimestamp;
    const queueTime = details.triggerTimestamp - details.addedTimestamp;

    const avgTime = currentQueueStats.avgTime ? (currentQueueStats.avgTime + reqTime) / 2 : reqTime;
    const avgProcessingTime = currentQueueStats.avgProcessingTime
      ? (currentQueueStats.avgProcessingTime + processTime) / 2
      : processTime;
    const avgQueueTime = currentQueueStats.avgProcessingTime
      ? (currentQueueStats.avgProcessingTime + queueTime) / 2
      : queueTime;

    this.stats[queueKey] = {
      ...this.stats[queueKey],
      total: currentQueueStats.total + 1,
      success: response.success ? currentQueueStats.success + 1 : currentQueueStats.success,
      failed: !response.success && !details.isCanceled ? currentQueueStats.failed + 1 : currentQueueStats.failed,
      canceled: details.isCanceled ? currentQueueStats.canceled + 1 : currentQueueStats.canceled,
      avgTime,
      minTime: currentQueueStats.minTime ? Math.min(currentQueueStats.minTime, reqTime) : reqTime,
      maxTime: Math.max(currentQueueStats.maxTime, reqTime),
      lastTime: reqTime,
      avgQueueTime,
      minQueueTime: currentQueueStats.minQueueTime ? Math.min(currentQueueStats.minQueueTime, queueTime) : queueTime,
      maxQueueTime: Math.max(currentQueueStats.maxQueueTime, queueTime),
      lastQueueTime: queueTime,
      avgProcessingTime,
      minProcessingTime: currentQueueStats.minProcessingTime
        ? Math.min(currentQueueStats.minProcessingTime, processTime)
        : processTime,
      maxProcessingTime: Math.max(currentQueueStats.maxProcessingTime, processTime),
      lastProcessingTime: processTime,
    };
  }

  updateQueuesGeneralInfo = (client: ClientInstance) => {
    const fetchRequests = client.fetchDispatcher.getAllRunningRequest();
    const submitRequests = client.submitDispatcher.getAllRunningRequest();

    const allQueuedRequests: DevtoolsElement[] = [...fetchRequests, ...submitRequests].map((item) => {
      return {
        requestId: item.requestId,
        queueKey: item.request.queueKey,
        cacheKey: item.request.cacheKey,
        abortKey: item.request.abortKey,
      };
    });

    const fetchQueuesArray = Array.from(
      client.fetchDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);
    const submitQueuesArray = Array.from(
      client.submitDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);

    const pausedRequests: DevtoolsElement[] = [...fetchQueuesArray, ...submitQueuesArray].reduce((acc, queue) => {
      if (queue.stopped) {
        return [
          ...acc,
          ...queue.requests.map((item) => {
            return {
              requestId: item.requestId,
              queueKey: item.request.queueKey,
              cacheKey: item.request.cacheKey,
              abortKey: item.request.abortKey,
            };
          }),
        ];
      }

      queue.requests.forEach((item) => {
        if (item.stopped) {
          acc.push({
            requestId: item.requestId,
            queueKey: item.request.queueKey,
            cacheKey: item.request.cacheKey,
            abortKey: item.request.abortKey,
          });
        }
      });

      return acc;
    }, [] as DevtoolsElement[]);

    this.queuesInfo = [...fetchQueuesArray, ...submitQueuesArray];
    this.requestsInProgress = allQueuedRequests;
    this.requestsPaused = pausedRequests;
  };

  addSuccessRequest = ({
    requestId,
    response,
    details,
  }: {
    requestId: string;
    response: ResponseType<any, any, any>;
    details: ResponseDetailsType;
  }) => {
    this.requestsSucceeded.push({ requestId, response, details });
  };

  addFailedRequest = ({
    requestId,
    response,
    details,
  }: {
    requestId: string;
    response: ResponseType<any, any, any>;
    details: ResponseDetailsType;
  }) => {
    this.requestsFailed.push({ requestId, response, details });
  };
  // addCancelledRequest = ({ requestId, request }: {}) => {};
}
