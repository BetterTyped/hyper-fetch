import type { NonNullableKeys } from "@hyper-fetch/core";
import { produce } from "immer";
import { create } from "zustand/react";

import type { ErrorStats } from "./error-stats.store";
import { getErrorStats } from "./error-stats.store";
import type { NetworkStats } from "./network-stats.store";
import { getNetworkStats, initialNetworkStats } from "./network-stats.store";
import { getDataSize } from "./utils";
import type { DevtoolsRequestEvent } from "@/context/applications/types";

type QueueStatsStore = {
  applications: {
    [application: string]: {
      stats: Map<string, NetworkStats>;
      errorStats: Map<string, ErrorStats>;
    };
  };
  initialize: (applicationName: string) => void;
  setQueueStats: (data: { application: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => Promise<void>;
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

    set((state) => {
      const app = state.applications[application] ?? { stats: new Map(), errorStats: new Map() };
      const { queryKey } = data.request;
      const stats = new Map(app.stats);
      stats.set(queryKey, getNetworkStats(app.stats.get(queryKey) ?? initialNetworkStats, data, perf));
      const errorStats = new Map(app.errorStats);
      errorStats.set(queryKey, getErrorStats(data, app.errorStats.get(queryKey)));
      return { applications: { ...state.applications, [application]: { stats, errorStats } } };
    });
  },
}));
