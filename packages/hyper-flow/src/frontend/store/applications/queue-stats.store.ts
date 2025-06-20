import { produce } from "immer";
import { create } from "zustand/react";
import { NonNullableKeys } from "@hyper-fetch/core";

import { DevtoolsRequestEvent } from "@/context/applications/types";
import { getNetworkStats, initialNetworkStats, NetworkStats } from "./network-stats.store";
import { ErrorStats, getErrorStats } from "./error-stats.store";
import { getDataSize } from "./utils";

type QueueStatsStore = {
  applications: {
    [application: string]: {
      stats: Map<string, NetworkStats>;
      errorStats: Map<string, ErrorStats>;
    };
  };
  initialize: (applicationName: string) => void;
  setQueueStats: (data: { application: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => void;
};

export const useQueueStatsStore = create<QueueStatsStore>((set) => ({
  applications: {},
  initialize: (applicationName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[applicationName] = {
          stats: new Map(),
          errorStats: new Map(),
        };
      }),
    );
  },
  setQueueStats: async ({ application, data }) => {
    const responseSize = await getDataSize(data.response);
    const payloadSize = await getDataSize(data.request.payload);
    const perf = {
      responseSize,
      payloadSize,
    };

    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = {
            stats: new Map(),
            errorStats: new Map(),
          };
        }
        draft.applications[application].stats.set(
          data.request.queryKey,
          getNetworkStats(
            draft.applications[application].stats.get(data.request.queryKey) ?? initialNetworkStats,
            data,
            perf,
          ),
        );
        draft.applications[application].errorStats.set(data.request.queryKey, getErrorStats(data));
      }),
    );
  },
}));
