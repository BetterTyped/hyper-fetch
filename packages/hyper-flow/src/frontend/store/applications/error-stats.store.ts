import { produce } from "immer";
import { create } from "zustand/react";
import { NonNullableKeys, stringifyValue } from "@hyper-fetch/core";

import { DevtoolsRequestEvent } from "@/context/applications/types";
import { getEndpointAndMethod } from "./utils";

export type ErrorStats = {
  status: string | number;
  errors: string[]; // stringified error
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
};

export const initialErrorStats: ErrorStats = {
  status: 0,
  errors: [],
  count: 0,
  firstOccurrence: new Date(),
  lastOccurrence: new Date(),
};

export const getErrorStats = (data: NonNullableKeys<DevtoolsRequestEvent>, prev?: ErrorStats): ErrorStats => {
  if (data.response.success) {
    return prev || initialErrorStats;
  }

  return {
    status: data.response.status,
    errors: [...new Set([...(prev?.errors ?? []), stringifyValue(data.response.error)])],
    count: prev?.count ?? 0 + 1,
    firstOccurrence: prev?.firstOccurrence ?? new Date(),
    lastOccurrence: new Date(),
  };
};

type EndpointAndMethod = string;

export type ErrorStatsStore = {
  applications: {
    [application: string]: {
      statusErrorStats: Map<number | string, ErrorStats>;
      endpointErrorStats: Map<EndpointAndMethod, ErrorStats & { endpoint: string; method: string }>;
    };
  };
  initialize: (applicationName: string) => void;
  setErrorStats: (data: { application: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => void;
};

export const useErrorStatsStore = create<ErrorStatsStore>((set) => ({
  applications: {},
  initialize: (applicationName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[applicationName] = {
          statusErrorStats: new Map(),
          endpointErrorStats: new Map(),
        };
      }),
    );
  },
  setErrorStats: ({ application, data }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = {
            statusErrorStats: new Map(),
            endpointErrorStats: new Map(),
          };
        }
        const { status } = data.response;

        const globalEndpointAndMethod = getEndpointAndMethod(
          // api/users/:id
          data.request.requestOptions.endpoint,
          data.request.method,
          data.client,
        );

        const element = draft.applications[application].endpointErrorStats.get(globalEndpointAndMethod);
        if (!element) {
          draft.applications[application].statusErrorStats.set(status, initialErrorStats);
          draft.applications[application].endpointErrorStats.set(globalEndpointAndMethod, {
            ...initialErrorStats,
            endpoint: data.request.requestOptions.endpoint,
            method: data.request.requestOptions.method,
          });
        }
        draft.applications[application].endpointErrorStats.set(globalEndpointAndMethod, {
          ...getErrorStats(data, draft.applications[application].endpointErrorStats.get(globalEndpointAndMethod)),
          endpoint: data.request.requestOptions.endpoint,
          method: data.request.requestOptions.method,
        });
        draft.applications[application].statusErrorStats.set(
          status,
          getErrorStats(data, draft.applications[application].statusErrorStats.get(status)),
        );
      }),
    );
  },
}));
