import { produce } from "immer";
import { create } from "zustand/react";
import { AdapterInstance, Cache } from "@hyper-fetch/core";

import { DevtoolsCacheEvent, Sort } from "@/context/applications/types";

type CacheKey = string;

type CacheStore = {
  cacheSearchTerm: string;
  cacheSort: Sort | null;
  caches: Map<CacheKey, DevtoolsCacheEvent>;
  detailsId: string | null;
  loadingKeys: Set<CacheKey>;
};

const getInitialState = (): CacheStore => ({
  cacheSearchTerm: "",
  cacheSort: null,
  caches: new Map(),
  detailsId: null,
  loadingKeys: new Set(),
});

type Store = {
  applications: { [application: string]: CacheStore };
  initialize: (application: string) => void;
  setSearchTerm: (application: string, searchTerm: string) => void;
  openDetails: (data: { application: string; cacheKey: string }) => void;
  closeDetails: (application: string) => void;
  setCacheSort: (data: { application: string; sorting: Sort }) => void;
  setCache: (data: {
    application: string;
    data: Parameters<Parameters<Cache<AdapterInstance>["events"]["onData"]>[0]>[0];
    isTriggeredExternally: boolean;
  }) => void;
  setCacheItem: (data: { application: string; cacheKey: string; cacheData: DevtoolsCacheEvent["cacheData"] }) => void;
  invalidateCache: (data: { application: string; cacheKey: string }) => void;
  addLoadingKey: (data: { application: string; cacheKey: CacheKey }) => void;
  removeLoadingKey: (data: { application: string; cacheKey: CacheKey }) => void;
};

export const useCacheStore = create<Store>((set) => ({
  applications: {},
  initialize: (application: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application] = getInitialState();
      }),
    );
  },
  setSearchTerm: (application: string, searchTerm: string) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        draft.applications[application].cacheSearchTerm = searchTerm;
      }),
    );
  },
  openDetails: ({ application, cacheKey }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        draft.applications[application].detailsId = cacheKey;
      }),
    );
  },
  closeDetails: (application: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application].detailsId = null;
      }),
    );
  },
  setCacheSort: ({ application, sorting }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        draft.applications[application].cacheSort = sorting;
      }),
    );
  },
  setCache: ({ application, data, isTriggeredExternally }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        const { cacheKey } = data;

        // When we set the data and send it to the client, we DON'T want to re-apply it
        // It will cause state de-sync, because of the latency of the events circling around
        if (!isTriggeredExternally) {
          draft.applications[application].caches.set(cacheKey, {
            cacheKey,
            cacheData: data,
          });
        }
      }),
    );
  },
  setCacheItem: ({ application, cacheKey, cacheData }) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application].caches.set(cacheKey, { cacheKey, cacheData });
      }),
    );
  },
  invalidateCache: ({ application, cacheKey }) => {
    set((state) =>
      produce(state, (draft) => {
        const cacheData = draft.applications[application].caches.get(cacheKey);
        if (!cacheData) {
          return;
        }
        draft.applications[application].caches.set(cacheKey, {
          ...cacheData,
          cacheData: {
            ...cacheData.cacheData,
            staleTime: 0,
          },
        });
      }),
    );
  },
  addLoadingKey: ({ application, cacheKey }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        draft.applications[application].loadingKeys.add(cacheKey);
      }),
    );
  },
  removeLoadingKey: ({ application, cacheKey }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        draft.applications[application].loadingKeys.delete(cacheKey);
      }),
    );
  },
}));
