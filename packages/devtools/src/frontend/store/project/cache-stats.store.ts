import { produce } from "immer";
import { create } from "zustand/react";
import { RequestInstance } from "@hyper-fetch/core";

import { DevtoolsRequestResponse } from "types/message.parts";
import { getDataSize, getEndpointAndMethod } from "./utils";

export type CacheStats = {
  size: number;
  stale: number;
};

type CacheKey = string;
export type CacheStatsStore = {
  endpoint: string;
  method: string;
  staleEntries: number;
  garbageCollected: number;
  generalStats: CacheStats;
  cacheEntries: Map<
    CacheKey,
    {
      endpointWithParams: string;
      cacheKey: CacheKey;
      // stale time
      staleTime: number;
      // garbage collection
      cacheTime: number;
      // Stats
      stats: CacheStats;
    }
  >;
};

const getInitialState = ({ request }: { request: RequestInstance }): CacheStatsStore => ({
  endpoint: request.endpoint,
  method: request.method,
  staleEntries: 0,
  garbageCollected: 0,
  generalStats: {
    size: 0,
    stale: 0,
  },
  cacheEntries: new Map(),
});

const getStats = (current: { cacheSize: number; stale: number }): CacheStats => {
  const { cacheSize, stale } = current;
  return {
    size: cacheSize,
    stale,
  };
};

const generateCacheStats = ({
  currentStats,
  data,
  metadata,
}: {
  currentStats: CacheStatsStore;
  data: DevtoolsRequestResponse & { request: RequestInstance };
  metadata: {
    // KB size of the response
    cacheSize: number;
    // number of stale entries
    stale: number;
  };
}): CacheStatsStore => {
  const { request } = data;
  const previousEntry = currentStats.cacheEntries.get(request.cacheKey);

  currentStats.cacheEntries.set(request.cacheKey, {
    endpointWithParams: request.endpoint,
    cacheKey: request.cacheKey,
    staleTime: request.staleTime,
    cacheTime: request.cacheTime,
    ...previousEntry,
    stats: getStats(metadata),
  });

  return {
    ...currentStats,
    generalStats: getStats(metadata),
  };
};

type Store = {
  projects: {
    [project: string]: {
      generalStats: CacheStats;
      cachesStats: Map<string, CacheStatsStore>;
    };
  };
  initialize: (projectName: string) => void;
  setCacheStats: (data: {
    project: string;
    request: RequestInstance;
    data: DevtoolsRequestResponse & { request: RequestInstance };
  }) => void;
};

export const useCacheStatsStore = create<Store>((set) => ({
  projects: {},
  initialize: (project: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[project] = {
          generalStats: {
            size: 0,
            stale: 0,
          },
          cachesStats: new Map(),
        };
      }),
    );
  },
  setCacheStats: async ({ project, request, data }) => {
    const cacheSize = await getDataSize(data.response);

    const metadata = {
      cacheSize,
      stale: 0,
    };

    set((state) =>
      produce(state, (draft) => {
        const endpointAndMethod = getEndpointAndMethod(request);

        if (!draft.projects[project]) {
          draft.projects[project] = {
            generalStats: {
              size: 0,
              stale: 0,
            },
            cachesStats: new Map(),
          };
        }
        draft.projects[project].cachesStats.set(
          endpointAndMethod,
          generateCacheStats({
            currentStats: draft.projects[project].cachesStats.get(endpointAndMethod) ?? getInitialState({ request }),
            data,
            metadata,
          }),
        );
      }),
    );
  },
}));
