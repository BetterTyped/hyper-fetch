import { produce } from "immer";
import { create } from "zustand/react";
import { NonNullableKeys } from "@hyper-fetch/core";

import { getNetworkStats, initialNetworkStats, NetworkStats } from "./network-stats.store";
import { ErrorStats, getErrorStats } from "./error-stats.store";
import { getDataSize } from "./utils";

import { DevtoolsRequestEvent } from "@/context/applications/types";

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
  setMethodStats: (data: { application: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => void;
};

export const useMethodStatsStore = create<MethodStatsStore>((set) => ({
  applications: {},
  initialize: (applicationName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[applicationName] = {
          generalStats: initialNetworkStats,
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

    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = {
            generalStats: initialNetworkStats,
            methodsStats: new Map(),
          };
        }
        draft.applications[application].methodsStats.set(data.request.method, {
          method: data.request.method,
          methodStats: getNetworkStats(
            draft.applications[application].methodsStats.get(data.request.method)?.methodStats ?? initialNetworkStats,
            data,
            perf,
          ),
          errorStats: getErrorStats(data),
        });
      }),
    );
  },
}));
