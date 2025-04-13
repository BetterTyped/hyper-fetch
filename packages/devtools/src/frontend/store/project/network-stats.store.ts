import { produce } from "immer";
import { create } from "zustand/react";
import { NonNullableKeys } from "@hyper-fetch/core";

import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { getDataSize, getEndpointAndMethod } from "./utils";

export type NetworkStats = {
  // General
  totalRequests: number;
  totalRequestsLoading: number;
  totalRequestsSuccess: number;
  totalRequestsFailed: number;
  totalRequestsCanceled: number;
  totalRequestsPaused: number;
  totalRequestsRemoved: number;
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
  // Processing
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
  totalRequestsLoading: 0,
  totalRequestsSuccess: 0,
  totalRequestsFailed: 0,
  totalRequestsCanceled: 0,
  totalRequestsPaused: 0,
  totalRequestsRemoved: 0,
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

export const getNetworkStats = (
  currentStats: NetworkStats,
  data: NonNullableKeys<DevtoolsRequestEvent>,
  perf: {
    responseSize: number;
    payloadSize: number;
  },
): NetworkStats => {
  const { request, response, details } = data;

  const cached = request.cache ? 1 : 0;
  const nonCached = request.cache ? 0 : 1;

  const isSuccess = response?.success ?? false;
  const responseTime = details.responseTimestamp - response.requestTimestamp;
  const { responseSize, payloadSize } = perf;
  const isLoading = !response;

  return {
    // General
    totalRequests: currentStats.totalRequests + 1,
    totalRequestsLoading: currentStats.totalRequestsLoading + (isLoading ? 1 : 0),
    totalRequestsSuccess: currentStats.totalRequestsSuccess + (isSuccess ? 1 : 0),
    totalRequestsFailed: currentStats.totalRequestsFailed + (!isSuccess ? 1 : 0),
    totalRequestsCanceled: currentStats.totalRequestsCanceled,
    totalRequestsPaused: currentStats.totalRequestsPaused,
    totalRequestsRemoved: currentStats.totalRequestsRemoved,
    totalCachedRequests: currentStats.totalCachedRequests + cached,
    totalNonCachedRequests: currentStats.totalNonCachedRequests + nonCached,
    // Response
    avgResponseTime: currentStats.avgResponseTime,
    avgResponseTimeSuccess: currentStats.avgResponseTimeSuccess,
    avgResponseTimeFailed: currentStats.avgResponseTimeFailed,
    highestResponseTime: currentStats.highestResponseTime,
    highestResponseTimeSuccess: currentStats.highestResponseTimeSuccess,
    highestResponseTimeFailed: currentStats.highestResponseTimeFailed,
    lowestResponseTime: currentStats.lowestResponseTime,
    // eslint-disable-next-line no-nested-ternary
    lowestResponseTimeSuccess: isSuccess
      ? currentStats.lowestResponseTimeSuccess === 0
        ? responseTime
        : Math.min(currentStats.lowestResponseTimeSuccess, responseTime)
      : currentStats.lowestResponseTimeSuccess,
    // eslint-disable-next-line no-nested-ternary
    lowestResponseTimeFailed: !isSuccess
      ? currentStats.lowestResponseTimeFailed === 0
        ? responseTime
        : Math.min(currentStats.lowestResponseTimeFailed, responseTime)
      : currentStats.lowestResponseTimeFailed,
    latestResponseTime: responseTime,
    // Processing
    avgProcessingTime: currentStats.avgProcessingTime,
    highestProcessingTime: currentStats.highestProcessingTime,
    lowestProcessingTime: currentStats.lowestProcessingTime,
    latestProcessingTime: currentStats.latestProcessingTime,
    // Payload
    totalTransferredPayload: currentStats.totalTransferredPayload + payloadSize,
    totalTransferredResponse: currentStats.totalTransferredResponse + responseSize,
    avgPayloadSize: currentStats.avgPayloadSize,
    avgResponseSize: currentStats.avgResponseSize,
    lowestPayloadSize: currentStats.lowestPayloadSize,
    lowestResponseSize: currentStats.lowestResponseSize,
    highestPayloadSize: currentStats.highestPayloadSize,
    highestResponseSize: currentStats.highestResponseSize,
    latestResponseSize: responseSize,
    // Queue
    avgQueueTime: currentStats.avgQueueTime,
    highestQueueTime: currentStats.highestQueueTime,
    lowestQueueTime: currentStats.lowestQueueTime,
    latestQueueTime: currentStats.latestQueueTime,
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
        const endpointName = getEndpointAndMethod(data.request, data.client);
        draft.projects[project].networkStats = getNetworkStats(draft.projects[project].networkStats, data, perf);
        const existingEntry = draft.projects[project].networkEntries.get(endpointName);
        draft.projects[project].networkEntries.set(endpointName, {
          endpoint: data.request.endpoint,
          method: data.request.method,
          stats: getNetworkStats(existingEntry?.stats ?? initialNetworkStats, data, perf),
        });
      }),
    );
  },
}));
