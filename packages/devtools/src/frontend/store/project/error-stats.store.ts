import { produce } from "immer";
import { create } from "zustand/react";
import { NonNullableKeys, stringifyValue } from "@hyper-fetch/core";

import { DevtoolsRequestEvent } from "types/message.parts";
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
  projects: {
    [project: string]: {
      statusErrorStats: Map<number | string, ErrorStats>;
      endpointErrorStats: Map<EndpointAndMethod, ErrorStats>;
    };
  };
  initialize: (projectName: string) => void;
  setErrorStats: (data: { project: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => void;
};

export const useErrorStatsStore = create<ErrorStatsStore>((set) => ({
  projects: {},
  initialize: (projectName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[projectName] = {
          statusErrorStats: new Map(),
          endpointErrorStats: new Map(),
        };
      }),
    );
  },
  setErrorStats: ({ project, data }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = {
            statusErrorStats: new Map(),
            endpointErrorStats: new Map(),
          };
        }
        const { status } = data.response;
        const endpointAndMethod = getEndpointAndMethod(data.request);
        const element = draft.projects[project].endpointErrorStats.get(endpointAndMethod);
        if (!element) {
          draft.projects[project].statusErrorStats.set(status, initialErrorStats);
          draft.projects[project].endpointErrorStats.set(endpointAndMethod, initialErrorStats);
        }
        draft.projects[project].endpointErrorStats.set(
          endpointAndMethod,
          getErrorStats(data, draft.projects[project].endpointErrorStats.get(endpointAndMethod)),
        );
        draft.projects[project].statusErrorStats.set(
          status,
          getErrorStats(data, draft.projects[project].statusErrorStats.get(status)),
        );
      }),
    );
  },
}));
