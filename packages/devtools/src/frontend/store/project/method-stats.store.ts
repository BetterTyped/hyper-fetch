import { produce } from "immer";
import { create } from "zustand/react";
import { NonNullableKeys } from "@hyper-fetch/core";

import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { getNetworkStats, initialNetworkStats, NetworkStats } from "./network-stats.store";
import { ErrorStats, getErrorStats } from "./error-stats.store";
import { getDataSize } from "./utils";

type MethodStatsStore = {
  projects: {
    [project: string]: {
      generalStats: NetworkStats;
      methodsStats: Map<
        string,
        {
          method: string;
          networkStats: NetworkStats;
          errorStats: ErrorStats;
        }
      >;
    };
  };
  initialize: (projectName: string) => void;
  setMethodStats: (data: { project: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => void;
};

export const useMethodStatsStore = create<MethodStatsStore>((set) => ({
  projects: {},
  initialize: (projectName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[projectName] = {
          generalStats: initialNetworkStats,
          methodsStats: new Map(),
        };
      }),
    );
  },
  setMethodStats: async ({ project, data }) => {
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
            generalStats: initialNetworkStats,
            methodsStats: new Map(),
          };
        }
        draft.projects[project].methodsStats.set(data.request.method, {
          method: data.request.method,
          networkStats: getNetworkStats(
            draft.projects[project].methodsStats.get(data.request.method)?.networkStats ?? initialNetworkStats,
            data,
            perf,
          ),
          errorStats: getErrorStats(data),
        });
      }),
    );
  },
}));
