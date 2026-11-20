import type { NonNullableKeys } from "@hyper-fetch/core";
import { produce } from "immer";
import { create } from "zustand/react";

import { getDataSize, getEndpointAndMethod } from "./utils";
import type { DevtoolsRequestEvent } from "@/context/applications/types";

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
  networkStats: { ...initialNetworkStats },
  networkEntries: new Map(),
  responseTimeSamples: [],
});

/** How many of the latest response times are kept to compute percentiles */
export const RESPONSE_TIME_SAMPLE_SIZE = 1000;

/**
 * Nearest-rank percentile of the samples, e.g. `getPercentile(samples, 95)` is the time 95% of requests stayed under.
 * Returns `0` without samples.
 */
export const getPercentile = (samples: readonly number[], percentile: number): number => {
  if (!samples.length) {
    return 0;
  }
  const sorted = samples.toSorted((a, b) => a - b);
  const rank = Math.ceil((Math.min(Math.max(percentile, 0), 100) / 100) * sorted.length);
  return sorted[Math.max(rank, 1) - 1];
};

/** Running arithmetic mean, where `count` already includes the new value. */
const getAvgValue = (currentAvg: number, newValue: number, count: number) => {
  if (count <= 1) {
    return newValue;
  }
  return currentAvg + (newValue - currentAvg) / count;
};

const getHighestValue = (currentHighest: number, newValue: number, enabled = true) => {
  return enabled ? Math.max(currentHighest, newValue) : currentHighest;
};

/** `0` means "no value yet" until the first sample of the group, so it is replaced instead of compared. */
const getLowestValue = (currentLowest: number, newValue: number, previousCount: number) => {
  return previousCount === 0 ? newValue : Math.min(currentLowest, newValue);
};

const round = (value: number) => parseFloat(value.toFixed(2));

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
  const isSuccess = !!response.success;

  const responseTime = round(details.responseTimestamp - response.requestTimestamp);
  const processingTime = round(details.requestTimestamp - details.triggerTimestamp);
  const queueTime = round(details.triggerTimestamp - details.addedTimestamp);

  const previousTotal = currentStats.totalRequests;
  const previousSuccess = currentStats.totalRequestsSuccess;
  const previousFailed = currentStats.totalRequestsFailed;
  const totalRequests = previousTotal + 1;
  const totalRequestsSuccess = previousSuccess + (isSuccess ? 1 : 0);
  const totalRequestsFailed = previousFailed + (isSuccess ? 0 : 1);

  return {
    // General
    totalRequests,
    totalRequestsSuccess,
    totalRequestsFailed,
    totalRequestsCanceled: currentStats.totalRequestsCanceled,
    totalCachedRequests: currentStats.totalCachedRequests + (request.cache ? 1 : 0),
    totalNonCachedRequests: currentStats.totalNonCachedRequests + (request.cache ? 0 : 1),
    // Response
    avgResponseTime: getAvgValue(currentStats.avgResponseTime, responseTime, totalRequests),
    avgResponseTimeSuccess: isSuccess
      ? getAvgValue(currentStats.avgResponseTimeSuccess, responseTime, totalRequestsSuccess)
      : currentStats.avgResponseTimeSuccess,
    avgResponseTimeFailed: isSuccess
      ? currentStats.avgResponseTimeFailed
      : getAvgValue(currentStats.avgResponseTimeFailed, responseTime, totalRequestsFailed),
    highestResponseTime: getHighestValue(currentStats.highestResponseTime, responseTime),
    highestResponseTimeSuccess: getHighestValue(currentStats.highestResponseTimeSuccess, responseTime, isSuccess),
    highestResponseTimeFailed: getHighestValue(currentStats.highestResponseTimeFailed, responseTime, !isSuccess),
    lowestResponseTime: getLowestValue(currentStats.lowestResponseTime, responseTime, previousTotal),
    lowestResponseTimeSuccess: isSuccess
      ? getLowestValue(currentStats.lowestResponseTimeSuccess, responseTime, previousSuccess)
      : currentStats.lowestResponseTimeSuccess,
    lowestResponseTimeFailed: isSuccess
      ? currentStats.lowestResponseTimeFailed
      : getLowestValue(currentStats.lowestResponseTimeFailed, responseTime, previousFailed),
    latestResponseTime: responseTime,
    // Processing
    avgProcessingTime: getAvgValue(currentStats.avgProcessingTime, processingTime, totalRequests),
    highestProcessingTime: getHighestValue(currentStats.highestProcessingTime, processingTime),
    lowestProcessingTime: getLowestValue(currentStats.lowestProcessingTime, processingTime, previousTotal),
    latestProcessingTime: processingTime,
    // Payload
    totalTransferredPayload: currentStats.totalTransferredPayload + payloadSize,
    totalTransferredResponse: currentStats.totalTransferredResponse + responseSize,
    avgPayloadSize: getAvgValue(currentStats.avgPayloadSize, payloadSize, totalRequests),
    avgResponseSize: getAvgValue(currentStats.avgResponseSize, responseSize, totalRequests),
    lowestPayloadSize: getLowestValue(currentStats.lowestPayloadSize, payloadSize, previousTotal),
    lowestResponseSize: getLowestValue(currentStats.lowestResponseSize, responseSize, previousTotal),
    highestPayloadSize: getHighestValue(currentStats.highestPayloadSize, payloadSize),
    highestResponseSize: getHighestValue(currentStats.highestResponseSize, responseSize),
    latestResponseSize: responseSize,
    // Queue
    avgQueueTime: getAvgValue(currentStats.avgQueueTime, queueTime, totalRequests),
    highestQueueTime: getHighestValue(currentStats.highestQueueTime, queueTime),
    lowestQueueTime: getLowestValue(currentStats.lowestQueueTime, queueTime, previousTotal),
    latestQueueTime: queueTime,
  };
};

/** Canceled requests never get a response, so they are counted apart from the finished ones */
export const addCanceledRequest = (stats: NetworkStats): NetworkStats => ({
  ...stats,
  totalRequestsCanceled: stats.totalRequestsCanceled + 1,
});

type EndpointAndMethod = string;

export type NetworkStatsStore = {
  networkStats: NetworkStats;
  /** The latest response times, oldest first, up to `RESPONSE_TIME_SAMPLE_SIZE` */
  responseTimeSamples: number[];
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
  applications: { [application: string]: NetworkStatsStore };
  initialize: (application: string) => void;
  setNetworkStats: (data: { application: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => Promise<void>;
  countCanceledRequest: (data: { application: string }) => void;
}>((set) => ({
  applications: {},
  initialize: (application: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application] = getNetworkInitialState();
      }),
    );
  },
  countCanceledRequest: ({ application }) => {
    set((state) => {
      const app = state.applications[application];
      return {
        applications: {
          ...state.applications,
          [application]: { ...app, networkStats: addCanceledRequest(app.networkStats) },
        },
      };
    });
  },
  setNetworkStats: async ({ application, data }) => {
    const responseSize = await getDataSize(data.response);
    const payloadSize = await getDataSize(data.request.payload);
    const perf = {
      responseSize,
      payloadSize,
    };
    // Runs on every response, so it copies only what changed instead of drafting the whole state
    set((state) => {
      const app = state.applications[application];
      const globalEndpointAndMethod = getEndpointAndMethod(data.request, data.client);
      const networkStats = getNetworkStats(app.networkStats, data, perf);
      const responseTimeSamples = [...app.responseTimeSamples, networkStats.latestResponseTime].slice(
        -RESPONSE_TIME_SAMPLE_SIZE,
      );
      const networkEntries = new Map(app.networkEntries);
      networkEntries.set(globalEndpointAndMethod, {
        endpoint: data.request.requestOptions.endpoint,
        method: data.request.method,
        stats: getNetworkStats(
          app.networkEntries.get(globalEndpointAndMethod)?.stats ?? initialNetworkStats,
          data,
          perf,
        ),
      });
      return {
        applications: {
          ...state.applications,
          [application]: { networkStats, responseTimeSamples, networkEntries },
        },
      };
    });
  },
}));
