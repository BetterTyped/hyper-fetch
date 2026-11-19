import type { NonNullableKeys } from "@hyper-fetch/core";
import { stringifyValue } from "@hyper-fetch/core";
import { produce } from "immer";
import { create } from "zustand/react";

import { getEndpointAndMethod } from "./utils";
import type { DevtoolsRequestEvent } from "@/context/applications/types";

export type ErrorStats = {
  status: string | number;
  errors: string[]; // stringified error
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
};

export const getInitialErrorStats = (): ErrorStats => ({
  status: 0,
  errors: [],
  count: 0,
  firstOccurrence: new Date(),
  lastOccurrence: new Date(),
});

/** Add a response to the error stats of its group. Successful responses leave the stats as they are. */
export const getErrorStats = (data: NonNullableKeys<DevtoolsRequestEvent>, prev?: ErrorStats): ErrorStats => {
  if (data.response.success) {
    return prev ?? getInitialErrorStats();
  }

  const now = new Date();
  const hasPrevious = !!prev && prev.count > 0;

  return {
    status: data.response.status ?? 0,
    errors: [...new Set([...(prev?.errors ?? []), stringifyValue(data.response.error)])],
    count: (prev?.count ?? 0) + 1,
    firstOccurrence: hasPrevious ? prev.firstOccurrence : now,
    lastOccurrence: now,
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

        const globalEndpointAndMethod = getEndpointAndMethod(data.request, data.client);

        draft.applications[application].endpointErrorStats.set(globalEndpointAndMethod, {
          ...getErrorStats(data, draft.applications[application].endpointErrorStats.get(globalEndpointAndMethod)),
          endpoint: data.request.requestOptions.endpoint,
          method: data.request.method,
        });
        draft.applications[application].statusErrorStats.set(
          status ?? 0,
          getErrorStats(data, draft.applications[application].statusErrorStats.get(status ?? 0)),
        );
      }),
    );
  },
}));
