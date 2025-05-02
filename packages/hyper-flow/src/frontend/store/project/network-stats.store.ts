import { produce } from "immer";
import { create } from "zustand/react";
import { NonNullableKeys } from "@hyper-fetch/core";

import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { getDataSize, getEndpointAndMethod } from "./utils";

export type NetworkStats = {
  // General
  totalRequests: number;
  totalRequestsSuccess: number;
  totalRequestsFailed: number;
  totalRequestsCanceled: number;
  totalCachedRequests: number;
  totalNonCachedRequests: number;
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
  latestResponseTime: number;
  // Processing / Queue
  avgProcessingTime: number;
  highestProcessingTime: number;
  lowestProcessingTime: number;
  latestProcessingTime: number;
  // Payload
  totalTransferredPayload: number;
  totalTransferredResponse: number;
  avgPayloadSize: number;
  avgResponseSize: number;
  lowestPayloadSize: number;
  lowestResponseSize: number;
  highestPayloadSize: number;
  highestResponseSize: number;
  latestResponseSize: number;
  // Queue
  avgQueueTime: number;
  highestQueueTime: number;
  lowestQueueTime: number;
  latestQueueTime: number;
};

export const initialNetworkStats: NetworkStats = {
  // General
  totalRequests: 0,
  totalRequestsSuccess: 0,
  totalRequestsFailed: 0,
  totalRequestsCanceled: 0,
  totalCachedRequests: 0,
  totalNonCachedRequests: 0,
  // Response
  avgResponseTime: 0,
  avgResponseTimeSuccess: 0,
  avgResponseTimeFailed: 0,
  highestResponseTime: 0,
  highestResponseTimeSuccess: 0,
  highestResponseTimeFailed: 0,
  lowestResponseTime: 0,
  lowestResponseTimeSuccess: 0,
  lowestResponseTimeFailed: 0,
  latestResponseTime: 0,
  // Processing
  avgProcessingTime: 0,
  highestProcessingTime: 0,
  lowestProcessingTime: 0,
  latestProcessingTime: 0,
  // Payload
  totalTransferredPayload: 0,
  totalTransferredResponse: 0,
  avgPayloadSize: 0,
  avgResponseSize: 0,
  lowestPayloadSize: 0,
  lowestResponseSize: 0,
  highestPayloadSize: 0,
  highestResponseSize: 0,
  latestResponseSize: 0,
  // Queue
  avgQueueTime: 0,
  highestQueueTime: 0,
  lowestQueueTime: 0,
  latestQueueTime: 0,
};

const getNetworkInitialState = (): NetworkStatsStore => ({
  networkStats: initialNetworkStats,
  networkEntries: new Map(),
});

const getAvgValue = (currentAvg: number, newValue: number, enabled = true) => {
  if (!currentAvg) return newValue;
  return enabled ? parseFloat(((currentAvg + newValue) / 2).toFixed(2)) : currentAvg;
};

const getHighestValue = (currentHighest: number, newValue: number, enabled = true) => {
  return enabled ? Math.max(currentHighest, newValue) : currentHighest;
};

const getLowestValue = (currentLowest: number, newValue: number, enabled = true) => {
  return enabled ? Math.min(currentLowest, newValue) : currentLowest;
};

export const getNetworkStats = (
  currentStats: NetworkStats,
  data: NonNullableKeys<DevtoolsRequestEvent>,
  perf: {
    responseSize: number;
    payloadSize: number;
  },
): NetworkStats => {
  const { request, response, details } = data;
  const { responseSize, payloadSize } = perf;

  const responseTime = parseFloat((details.responseTimestamp - response.requestTimestamp).toFixed(2));
  const processingTime = parseFloat((details.requestTimestamp - details.triggerTimestamp).toFixed(2));
  const queueTime = parseFloat((details.triggerTimestamp - details.addedTimestamp).toFixed(2));

  return {
    // General
    totalRequests: currentStats.totalRequests + 1,
    totalRequestsSuccess: currentStats.totalRequestsSuccess + (response.success ? 1 : 0),
    totalRequestsFailed: currentStats.totalRequestsFailed + (!response.success ? 1 : 0),
    totalRequestsCanceled: currentStats.totalRequestsCanceled + (details.isCanceled ? 1 : 0),
    totalCachedRequests: currentStats.totalCachedRequests + (request.cache ? 1 : 0),
    totalNonCachedRequests: currentStats.totalNonCachedRequests + (request.cache ? 0 : 1),
    // Response
    avgResponseTime: getAvgValue(currentStats.avgResponseTime, responseTime),
    avgResponseTimeSuccess: getAvgValue(currentStats.avgResponseTimeSuccess, responseTime, response.success),
    avgResponseTimeFailed: getAvgValue(currentStats.avgResponseTimeFailed, responseTime, !response.success),
    highestResponseTime: getHighestValue(currentStats.highestResponseTime, responseTime),
    highestResponseTimeSuccess: getHighestValue(
      currentStats.highestResponseTimeSuccess,
      responseTime,
      response.success,
    ),
    highestResponseTimeFailed: getHighestValue(currentStats.highestResponseTimeFailed, responseTime, !response.success),
    lowestResponseTime: getLowestValue(currentStats.lowestResponseTime, responseTime),
    lowestResponseTimeSuccess: getLowestValue(currentStats.lowestResponseTimeSuccess, responseTime, response.success),
    lowestResponseTimeFailed: getLowestValue(currentStats.lowestResponseTimeFailed, responseTime, !response.success),
    latestResponseTime: responseTime,
    // Processing
    avgProcessingTime: getAvgValue(currentStats.avgProcessingTime, processingTime),
    highestProcessingTime: getHighestValue(currentStats.highestProcessingTime, processingTime),
    lowestProcessingTime: getLowestValue(currentStats.lowestProcessingTime, processingTime),
    latestProcessingTime: processingTime,
    // Payload
    totalTransferredPayload: currentStats.totalTransferredPayload + payloadSize,
    totalTransferredResponse: currentStats.totalTransferredResponse + responseSize,
    avgPayloadSize: getAvgValue(currentStats.avgPayloadSize, payloadSize),
    avgResponseSize: getAvgValue(currentStats.avgResponseSize, responseSize),
    lowestPayloadSize: getLowestValue(currentStats.lowestPayloadSize, payloadSize),
    lowestResponseSize: getLowestValue(currentStats.lowestResponseSize, responseSize),
    highestPayloadSize: getHighestValue(currentStats.highestPayloadSize, payloadSize),
    highestResponseSize: getHighestValue(currentStats.highestResponseSize, responseSize),
    latestResponseSize: responseSize,
    // Queue
    avgQueueTime: getAvgValue(currentStats.avgQueueTime, queueTime),
    highestQueueTime: getHighestValue(currentStats.highestQueueTime, queueTime),
    lowestQueueTime: getLowestValue(currentStats.lowestQueueTime, queueTime),
    latestQueueTime: queueTime,
  };
};

type EndpointAndMethod = string;

export type NetworkStatsStore = {
  networkStats: NetworkStats;
  networkEntries: Map<
    EndpointAndMethod,
    {
      endpoint: string;
      method: string;
      stats: NetworkStats;
    }
  >;
};

export const useNetworkStatsStore = create<{
  projects: { [project: string]: NetworkStatsStore };
  initialize: (project: string) => void;
  setNetworkStats: (data: { project: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => void;
}>((set) => ({
  projects: {},
  initialize: (project: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[project] = getNetworkInitialState();
      }),
    );
  },
  setNetworkStats: async ({ project, data }) => {
    const responseSize = await getDataSize(data.response);
    const payloadSize = await getDataSize(data.request.payload);
    const perf = {
      responseSize,
      payloadSize,
    };
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getNetworkInitialState();
        }

        const globalEndpointAndMethod = getEndpointAndMethod(
          // api/users/:id
          data.request.requestOptions.endpoint,
          data.request.method,
          data.client,
        );

        draft.projects[project].networkStats = getNetworkStats(draft.projects[project].networkStats, data, perf);
        const existingEntry = draft.projects[project].networkEntries.get(globalEndpointAndMethod);
        draft.projects[project].networkEntries.set(globalEndpointAndMethod, {
          endpoint: data.request.endpoint,
          method: data.request.method,
          stats: getNetworkStats(existingEntry?.stats ?? initialNetworkStats, data, perf),
        });
      }),
    );
  },
}));
