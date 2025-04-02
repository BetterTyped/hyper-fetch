/* eslint-disable no-nested-ternary */
import { Updater } from "use-immer";
import { NonNullableKeys, QueueDataType, RequestInstance, stringifyValue } from "@hyper-fetch/core";

import {
  DevtoolsRequestResponse,
  DevtoolsRequestEvent,
  DevtoolsElement,
  DevtoolsRequestQueueStats,
  DevtoolsCacheEvent,
  Sort,
} from "../types";
import { Status } from "frontend/utils/request.status.utils";
import { createContext } from "frontend/utils/context";
import { DevtoolsExplorerRequest } from "frontend/pages/project/requests/list/content.types";

export type ConnectionStats = {
  // General
  totalRequests: number;
  totalRequestsSuccess: number;
  totalRequestsFailed: number;
  // Response
  avgResponseTime: number;
  avgResponseTimeSuccess: number;
  avgResponseTimeFailed: number;
  highestResponseTime: number;
  highestResponseTimeSuccess: number;
  highestResponseTimeFailed: number;
  lowestResponseTime: number;
  lowestResponseTimeSuccess: number;
  lowestResponseTimeFailed: number;
  // Processing
  avgProcessingTime: number;
  highestProcessingTime: number;
  lowestProcessingTime: number;
  // Payload
  totalTransferredPayload: number;
  totalTransferredResponse: number;
  avgPayloadSize: number;
  avgResponseSize: number;
  lowestPayloadSize: number;
  lowestResponseSize: number;
  highestPayloadSize: number;
  highestResponseSize: number;
  // Queue
  avgQueueTime: number;
  highestQueueTime: number;
  lowestQueueTime: number;
};

export type MethodStats = {
  totalRequests: number;
  totalRequestsSuccess: number;
  totalRequestsFailed: number;
  avgResponseTime: number;
  avgResponseTimeSuccess: number;
  avgResponseTimeFailed: number;
  highestResponseTime: number;
  highestResponseTimeSuccess: number;
  highestResponseTimeFailed: number;
  lowestResponseTime: number;
  lowestResponseTimeSuccess: number;
  lowestResponseTimeFailed: number;
};

export type ProjectState = {
  isOnline: boolean;
  networkSearchTerm: string;
  networkSort: Sort | null;
  // Requests
  requests: DevtoolsRequestEvent[];
  success: DevtoolsRequestResponse[];
  failed: DevtoolsRequestResponse[];
  removed: DevtoolsElement[];
  inProgress: DevtoolsElement[];
  paused: DevtoolsElement[];
  canceled: DevtoolsElement[];
  // Per endpoint statistics
  generalStats: ConnectionStats;
  endpointsStats: {
    [methodAndEndpoint: string]: ConnectionStats & {
      method: string;
      endpoint: string;
    };
  };
  methodStats: {
    [method: string]: MethodStats;
  };
  // Devtools
  detailsRequestId: string | null;
  networkFilter: Status | null;
  cacheSearchTerm: string;
  cacheSort: Sort | null;
  cache: DevtoolsCacheEvent[];
  detailsCacheKey: string | null;
  loadingKeys: string[];
  processingSearchTerm: string;
  processingSort: Sort | null;
  queues: QueueDataType[];
  detailsQueueKey: string | null;
  stats: {
    [queryKey: string]: DevtoolsRequestQueueStats;
  };
  explorerSearchTerm: string;
  detailsExplorerRequest: DevtoolsExplorerRequest | null;
  explorerRequests: RequestInstance[];
};

type ProjectStateContextType = {
  projectStates: {
    [key: string]: ProjectState;
  };
  setProjectStates: Updater<{
    [key: string]: ProjectState;
  }>;
};

export const [ProjectStatesContext, useProjectStates] = createContext<ProjectStateContextType>("ProjectStateProvider", {
  projectStates: {},
  setProjectStates: () => {},
});

// Initial States

export const initialStats: ConnectionStats = {
  totalRequests: 0,
  totalRequestsSuccess: 0,
  totalRequestsFailed: 0,
  avgResponseTime: 0,
  avgResponseTimeSuccess: 0,
  avgResponseTimeFailed: 0,
  highestResponseTime: 0,
  highestResponseTimeSuccess: 0,
  highestResponseTimeFailed: 0,
  lowestResponseTime: 0,
  lowestResponseTimeSuccess: 0,
  lowestResponseTimeFailed: 0,
  avgProcessingTime: 0,
  highestProcessingTime: 0,
  lowestProcessingTime: 0,
  totalTransferredPayload: 0,
  totalTransferredResponse: 0,
  avgPayloadSize: 0,
  avgResponseSize: 0,
  lowestPayloadSize: 0,
  lowestResponseSize: 0,
  highestPayloadSize: 0,
  highestResponseSize: 0,
  avgQueueTime: 0,
  highestQueueTime: 0,
  lowestQueueTime: 0,
};

export const initialMethodStats: MethodStats = {
  totalRequests: 0,
  totalRequestsSuccess: 0,
  totalRequestsFailed: 0,
  avgResponseTime: 0,
  avgResponseTimeSuccess: 0,
  avgResponseTimeFailed: 0,
  highestResponseTime: 0,
  highestResponseTimeSuccess: 0,
  highestResponseTimeFailed: 0,
  lowestResponseTime: 0,
  lowestResponseTimeSuccess: 0,
  lowestResponseTimeFailed: 0,
};

export const initialProjectState: ProjectState = {
  isOnline: false,
  // Requests
  requests: [],
  success: [],
  failed: [],
  removed: [],
  inProgress: [],
  paused: [],
  canceled: [],
  // Stats
  generalStats: {
    ...initialStats,
  },
  endpointsStats: {},
  methodStats: {},
  // Network
  networkSearchTerm: "",
  networkSort: null,
  networkFilter: null,
  detailsRequestId: null,
  // Cache
  cacheSearchTerm: "",
  cacheSort: null,
  cache: [],
  detailsCacheKey: null,
  loadingKeys: [],
  // Processing
  processingSearchTerm: "",
  processingSort: null,
  queues: [],
  detailsQueueKey: null,
  stats: {},
  // Explorer
  explorerSearchTerm: "",
  detailsExplorerRequest: null,
  explorerRequests: [],
};

export const generateMethodStats = ({
  existingStats = initialMethodStats,
  response,
  details,
}: {
  existingStats: MethodStats;
} & NonNullableKeys<Pick<DevtoolsRequestEvent, "request" | "response" | "details">>): MethodStats => {
  const isSuccess = response?.success ?? false;
  const responseTime = details.responseTimestamp - response.requestTimestamp;

  return {
    totalRequests: existingStats.totalRequests + 1,
    totalRequestsSuccess: existingStats.totalRequestsSuccess + (isSuccess ? 1 : 0),
    totalRequestsFailed: existingStats.totalRequestsFailed + (!isSuccess ? 1 : 0),
    avgResponseTime:
      (existingStats.avgResponseTime * existingStats.totalRequests + responseTime) / existingStats.totalRequests,
    avgResponseTimeSuccess:
      existingStats.totalRequestsSuccess > 0
        ? (existingStats.avgResponseTimeSuccess * existingStats.totalRequestsSuccess + (isSuccess ? responseTime : 0)) /
          existingStats.totalRequestsSuccess
        : 0,
    avgResponseTimeFailed:
      existingStats.totalRequestsFailed > 0
        ? (existingStats.avgResponseTimeFailed * existingStats.totalRequestsFailed + (!isSuccess ? responseTime : 0)) /
          existingStats.totalRequestsFailed
        : 0,
    highestResponseTime: Math.max(existingStats.highestResponseTime, responseTime),
    highestResponseTimeSuccess: isSuccess
      ? Math.max(existingStats.highestResponseTimeSuccess, responseTime)
      : existingStats.highestResponseTimeSuccess,
    highestResponseTimeFailed: !isSuccess
      ? Math.max(existingStats.highestResponseTimeFailed, responseTime)
      : existingStats.highestResponseTimeFailed,
    lowestResponseTime:
      existingStats.lowestResponseTime === 0 ? responseTime : Math.min(existingStats.lowestResponseTime, responseTime),
    lowestResponseTimeSuccess: isSuccess
      ? existingStats.lowestResponseTimeSuccess === 0
        ? responseTime
        : Math.min(existingStats.lowestResponseTimeSuccess, responseTime)
      : existingStats.lowestResponseTimeSuccess,
    lowestResponseTimeFailed: !isSuccess
      ? existingStats.lowestResponseTimeFailed === 0
        ? responseTime
        : Math.min(existingStats.lowestResponseTimeFailed, responseTime)
      : existingStats.lowestResponseTimeFailed,
  };
};

export const generateEndpointStats = ({
  existingStats = initialStats,
  request,
  response,
  details,
}: {
  existingStats: ConnectionStats | undefined;
} & NonNullableKeys<Pick<DevtoolsRequestEvent, "request" | "response" | "details">>): ConnectionStats => {
  const isSuccess = response?.success ?? false;

  const responseTime = details.responseTimestamp - response.requestTimestamp;
  const processingTime = details.requestTimestamp - details.triggerTimestamp;
  const queueTime = details.triggerTimestamp - details.addedTimestamp;

  // Handle payload size calculation
  let payloadSize = 0;
  if (request?.payload) {
    if (request.payload instanceof FormData) {
      // Calculate FormData size by iterating through entries
      // eslint-disable-next-line no-restricted-syntax
      for (const pair of request.payload.entries()) {
        // Add size of the key
        payloadSize += pair[0].length;

        // Handle value based on type
        const value = pair[1];
        if (value instanceof File) {
          payloadSize += value.size;
        } else if (typeof value === "string") {
          payloadSize += value.length;
        } else {
          payloadSize += String(value).length;
        }
      }
    } else {
      payloadSize = stringifyValue(request.payload).length;
    }
  }

  // Handle response size calculation
  let responseSize = 0;
  if (response?.data) {
    if (
      response.data instanceof ReadableStream ||
      response.data instanceof Blob ||
      response.data instanceof ArrayBuffer
    ) {
      // For streams/blobs/buffers, use the content-length header if available
      const contentLength = response.extra?.headers?.["content-length"];
      if (contentLength) {
        responseSize = contentLength ? parseInt(contentLength, 10) : 0;
      }
    } else {
      responseSize = stringifyValue(response.data).length;
    }
  }

  const totalRequests = existingStats.totalRequests + 1;
  const totalSuccess = existingStats.totalRequestsSuccess + (isSuccess ? 1 : 0);
  const totalFailed = existingStats.totalRequestsFailed + (!isSuccess ? 1 : 0);

  return {
    // General stats
    totalRequests,
    totalRequestsSuccess: totalSuccess,
    totalRequestsFailed: totalFailed,

    // Response time stats
    avgResponseTime: (existingStats.avgResponseTime * existingStats.totalRequests + responseTime) / totalRequests,
    avgResponseTimeSuccess:
      totalSuccess > 0
        ? (existingStats.avgResponseTimeSuccess * existingStats.totalRequestsSuccess + (isSuccess ? responseTime : 0)) /
          totalSuccess
        : 0,
    avgResponseTimeFailed:
      totalFailed > 0
        ? (existingStats.avgResponseTimeFailed * existingStats.totalRequestsFailed + (!isSuccess ? responseTime : 0)) /
          totalFailed
        : 0,
    highestResponseTime: Math.max(existingStats.highestResponseTime, responseTime),
    highestResponseTimeSuccess: isSuccess
      ? Math.max(existingStats.highestResponseTimeSuccess, responseTime)
      : existingStats.highestResponseTimeSuccess,
    highestResponseTimeFailed: !isSuccess
      ? Math.max(existingStats.highestResponseTimeFailed, responseTime)
      : existingStats.highestResponseTimeFailed,
    lowestResponseTime:
      existingStats.lowestResponseTime === 0 ? responseTime : Math.min(existingStats.lowestResponseTime, responseTime),
    // eslint-disable-next-line no-nested-ternary
    lowestResponseTimeSuccess: isSuccess
      ? existingStats.lowestResponseTimeSuccess === 0
        ? responseTime
        : Math.min(existingStats.lowestResponseTimeSuccess, responseTime)
      : existingStats.lowestResponseTimeSuccess,
    // eslint-disable-next-line no-nested-ternary
    lowestResponseTimeFailed: !isSuccess
      ? existingStats.lowestResponseTimeFailed === 0
        ? responseTime
        : Math.min(existingStats.lowestResponseTimeFailed, responseTime)
      : existingStats.lowestResponseTimeFailed,

    // Processing time stats
    avgProcessingTime: (existingStats.avgProcessingTime * existingStats.totalRequests + processingTime) / totalRequests,
    highestProcessingTime: Math.max(existingStats.highestProcessingTime, processingTime),
    lowestProcessingTime:
      existingStats.lowestProcessingTime === 0
        ? processingTime
        : Math.min(existingStats.lowestProcessingTime, processingTime),

    // Payload and response size stats
    totalTransferredPayload: existingStats.totalTransferredPayload + payloadSize,
    totalTransferredResponse: existingStats.totalTransferredResponse + responseSize,
    avgPayloadSize: (existingStats.avgPayloadSize * existingStats.totalRequests + payloadSize) / totalRequests,
    avgResponseSize: (existingStats.avgResponseSize * existingStats.totalRequests + responseSize) / totalRequests,
    lowestPayloadSize:
      existingStats.lowestPayloadSize === 0 ? payloadSize : Math.min(existingStats.lowestPayloadSize, payloadSize),
    lowestResponseSize:
      existingStats.lowestResponseSize === 0 ? responseSize : Math.min(existingStats.lowestResponseSize, responseSize),
    highestPayloadSize: Math.max(existingStats.highestPayloadSize, payloadSize),
    highestResponseSize: Math.max(existingStats.highestResponseSize, responseSize),

    // Queue time stats
    avgQueueTime: (existingStats.avgQueueTime * existingStats.totalRequests + queueTime) / totalRequests,
    highestQueueTime: Math.max(existingStats.highestQueueTime, queueTime),
    lowestQueueTime:
      existingStats.lowestQueueTime === 0 ? queueTime : Math.min(existingStats.lowestQueueTime, queueTime),
  };
};

export const getEndpointStatsKey = (request: RequestInstance) => {
  return `${request.method}-${request.endpoint}`;
};
