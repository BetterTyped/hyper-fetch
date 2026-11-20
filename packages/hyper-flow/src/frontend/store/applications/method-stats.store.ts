import type { NonNullableKeys } from "@hyper-fetch/core";
import { produce } from "immer";
import { create } from "zustand/react";

import type { ErrorStats } from "./error-stats.store";
import { getErrorStats } from "./error-stats.store";
import type { NetworkStats } from "./network-stats.store";
import { getNetworkStats, initialNetworkStats } from "./network-stats.store";
import { getDataSize } from "./utils";
import type { DevtoolsRequestEvent } from "@/context/applications/types";

type MethodStatsStore = {
  applications: {
    [application: string]: {
      generalStats: NetworkStats;
      methodsStats: Map<
        string,
        {
          method: string;
          methodStats: NetworkStats;
          errorStats: ErrorStats;
        }
      >;
    };
  };
  initialize: (applicationName: string) => void;
  setMethodStats: (data: { application: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => Promise<void>;
};

export const useMethodStatsStore = create<MethodStatsStore>((set) => ({
  applications: {},
  initialize: (applicationName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[applicationName] = {
          generalStats: { ...initialNetworkStats },
          methodsStats: new Map(),
        };
      }),
    );
  },
  setMethodStats: async ({ application, data }) => {
    const responseSize = await getDataSize(data.response);
    const payloadSize = await getDataSize(data.request.payload);
    const perf = {
      responseSize,
      payloadSize,
    };

    set((state) => {
      const app = state.applications[application];
      const existing = app.methodsStats.get(data.request.method);
      const methodsStats = new Map(app.methodsStats);
      methodsStats.set(data.request.method, {
        method: data.request.method,
        methodStats: getNetworkStats(existing?.methodStats ?? initialNetworkStats, data, perf),
        errorStats: getErrorStats(data, existing?.errorStats),
      });
      return {
        applications: {
          ...state.applications,
          [application]: { generalStats: getNetworkStats(app.generalStats, data, perf), methodsStats },
        },
      };
    });
  },
}));
