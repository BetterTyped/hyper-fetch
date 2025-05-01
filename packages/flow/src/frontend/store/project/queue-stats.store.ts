import { produce } from "immer";
import { create } from "zustand/react";
import { NonNullableKeys } from "@hyper-fetch/core";

import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { getNetworkStats, initialNetworkStats, NetworkStats } from "./network-stats.store";
import { ErrorStats, getErrorStats } from "./error-stats.store";
import { getDataSize } from "./utils";

type QueueStatsStore = {
  projects: {
    [project: string]: {
      stats: Map<string, NetworkStats>;
      errorStats: Map<string, ErrorStats>;
    };
  };
  initialize: (projectName: string) => void;
  setQueueStats: (data: { project: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => void;
};

export const useQueueStatsStore = create<QueueStatsStore>((set) => ({
  projects: {},
  initialize: (projectName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[projectName] = {
          stats: new Map(),
          errorStats: new Map(),
        };
      }),
    );
  },
  setQueueStats: async ({ project, data }) => {
    const responseSize = await getDataSize(data.response);
    const payloadSize = await getDataSize(data.request.payload);
    const perf = {
      responseSize,
      payloadSize,
    };

    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = {
            stats: new Map(),
            errorStats: new Map(),
          };
        }
        draft.projects[project].stats.set(
          data.request.queryKey,
          getNetworkStats(draft.projects[project].stats.get(data.request.queryKey) ?? initialNetworkStats, data, perf),
        );
        draft.projects[project].errorStats.set(data.request.queryKey, getErrorStats(data));
      }),
    );
  },
}));
