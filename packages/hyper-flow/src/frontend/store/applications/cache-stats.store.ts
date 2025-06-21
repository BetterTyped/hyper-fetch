import { produce } from "immer";
import { create } from "zustand/react";
import { NonNullableKeys, RequestInstance, RequestJSON } from "@hyper-fetch/core";

import { getDataSize, getEndpointAndMethod } from "./utils";

import { DevtoolsRequestEvent, DevtoolsRequestResponse } from "@/context/applications/types";

type CacheKey = string;
export type CacheStatsStore = {
  endpoint: string;
  method: string;
  generalStats: {
    cacheSize: number;
    notCachedSize: number;
  };
  /**
   * We can have one endpoint like get /api/users/:id
   * Which will store data to multiple caches, but it is basically the same "entity"
   * So we store the data in a map with the cacheKey as the key,
   * but we still track the general request stats
   */
  cacheEntries: Map<
    CacheKey,
    {
      endpointWithParams: string;
      cacheKey: CacheKey;
      // timestamp of the request from which we calculate the cache/stale time
      timestamp: number;
      // stale time
      staleTime: number;
      // garbage collection
      cacheTime: number;
      stats: {
        size: number;
      };
    }
  >;
  notCachedEntries: Map<
    CacheKey,
    {
      endpointWithParams: string;
      // timestamp of the request from which we calculate the cache/stale time
      timestamp: number;
      stats: {
        size: number;
      };
    }
  >;
};

const getInitialState = ({ request }: { request: RequestJSON<RequestInstance> }): CacheStatsStore => ({
  endpoint: request.requestOptions.endpoint,
  method: request.method,
  generalStats: {
    cacheSize: 0,
    notCachedSize: 0,
  },
  cacheEntries: new Map(),
  notCachedEntries: new Map(),
});

const generateCacheStats = ({
  currentStats,
  data,
  details,
}: {
  currentStats: CacheStatsStore;
  data: DevtoolsRequestResponse & { request: RequestJSON<RequestInstance> };
  details: {
    cacheSize: number;
  };
}): CacheStatsStore => {
  const { request } = data;
  const previousEntry = currentStats.cacheEntries.get(request.cacheKey);

  // if cached
  if (request.cache) {
    currentStats.cacheEntries.set(request.cacheKey, {
      endpointWithParams: request.endpoint,
      cacheKey: request.cacheKey,
      staleTime: request.staleTime,
      cacheTime: request.cacheTime,
      timestamp: data.details.responseTimestamp,
      ...previousEntry,
      stats: {
        size: details.cacheSize,
      },
    });
  }
  // if not cached
  else {
    currentStats.notCachedEntries.set(request.cacheKey, {
      endpointWithParams: request.endpoint,
      timestamp: data.details.responseTimestamp,
      stats: {
        size: details.cacheSize,
      },
    });
  }

  const totalSize = Array.from(currentStats.cacheEntries.values()).reduce((acc, curr) => acc + curr.stats.size, 0);
  const notCachedSize = Array.from(currentStats.notCachedEntries.values()).reduce(
    (acc, curr) => acc + curr.stats.size,
    0,
  );

  return {
    ...currentStats,
    generalStats: {
      cacheSize: totalSize,
      notCachedSize,
    },
  };
};

type Store = {
  applications: {
    [application: string]: {
      generalStats: {
        cacheSize: number;
        notCachedSize: number;
      };
      cachesStats: Map<string, CacheStatsStore>;
    };
  };
  initialize: (applicationName: string) => void;
  setCacheStats: (data: { application: string; data: NonNullableKeys<DevtoolsRequestEvent> }) => void;
};

export const useCacheStatsStore = create<Store>((set) => ({
  applications: {},
  initialize: (application: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application] = {
          generalStats: {
            cacheSize: 0,
            notCachedSize: 0,
          },
          cachesStats: new Map(),
        };
      }),
    );
  },
  setCacheStats: async ({ application, data }) => {
    const cacheSize = await getDataSize(data.response);

    set((state) =>
      produce(state, (draft) => {
        const globalEndpointAndMethod = getEndpointAndMethod(
          // api/users/:id
          data.request.requestOptions.endpoint,
          data.request.method,
          data.client,
        );
        if (!draft.applications[application]) {
          draft.applications[application] = {
            generalStats: {
              cacheSize: 0,
              notCachedSize: 0,
            },
            cachesStats: new Map(),
          };
        }

        draft.applications[application].cachesStats.set(
          globalEndpointAndMethod,
          generateCacheStats({
            currentStats:
              draft.applications[application].cachesStats.get(globalEndpointAndMethod) ??
              getInitialState({ request: data.request }),
            data,
            details: {
              cacheSize,
            },
          }),
        );

        const totalSize = Array.from(draft.applications[application].cachesStats.values()).reduce(
          (acc, curr) => acc + curr.generalStats.cacheSize,
          0,
        );

        draft.applications[application].generalStats.cacheSize = totalSize;
      }),
    );
  },
}));
