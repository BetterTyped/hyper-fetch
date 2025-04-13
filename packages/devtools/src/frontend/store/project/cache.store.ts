import { produce } from "immer";
import { create } from "zustand/react";
import { Cache, CacheValueType } from "@hyper-fetch/core";

import { DevtoolsCacheEvent, Sort } from "frontend/context/projects/types";

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
  projects: { [project: string]: CacheStore };
  initialize: (project: string) => void;
  setSearchTerm: (project: string, searchTerm: string) => void;
  openDetails: (data: { project: string; cacheKey: string }) => void;
  setCacheSort: (data: { project: string; sorting: Sort }) => void;
  setCache: (data: { project: string; data: Parameters<Parameters<Cache["events"]["onData"]>[0]>[0] }) => void;
  invalidateCache: (data: { project: string; cacheKey: string }) => void;
  addLoadingKey: (data: { project: string; cacheKey: CacheKey }) => void;
  removeLoadingKey: (data: { project: string; cacheKey: CacheKey }) => void;
};

export const useCacheStore = create<Store>((set) => ({
  projects: {},
  initialize: (project: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[project] = getInitialState();
      }),
    );
  },
  setSearchTerm: (project: string, searchTerm: string) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getInitialState();
        }
        draft.projects[project].cacheSearchTerm = searchTerm;
      }),
    );
  },
  openDetails: ({ project, cacheKey }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getInitialState();
        }
        draft.projects[project].detailsId = cacheKey;
      }),
    );
  },
  setCacheSort: ({ project, sorting }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getInitialState();
        }
        draft.projects[project].cacheSort = sorting;
      }),
    );
  },
  setCache: ({ project, data }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getInitialState();
        }
        const { cacheKey, isTriggeredExternally } = data;

        // TODO: ???
        if (isTriggeredExternally) {
          draft.projects[project].caches.set(cacheKey, {
            cacheKey,
            cacheData: data.data as CacheValueType<unknown, unknown, any>,
          });
        }
      }),
    );
  },
  invalidateCache: ({ project, cacheKey }) => {
    set((state) =>
      produce(state, (draft) => {
        const cacheData = draft.projects[project].caches.get(cacheKey);
        if (!cacheData) {
          return;
        }
        draft.projects[project].caches.set(cacheKey, {
          ...cacheData,
          cacheData: {
            ...cacheData.cacheData,
            staleTime: 0,
          },
        });
      }),
    );
  },
  addLoadingKey: ({ project, cacheKey }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getInitialState();
        }
        draft.projects[project].loadingKeys.add(cacheKey);
      }),
    );
  },
  removeLoadingKey: ({ project, cacheKey }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getInitialState();
        }
        draft.projects[project].loadingKeys.delete(cacheKey);
      }),
    );
  },
}));
