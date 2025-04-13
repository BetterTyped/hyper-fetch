import { produce } from "immer";
import { create } from "zustand/react";
import { QueueDataType, RequestInstance } from "@hyper-fetch/core";

type QueryKey = string;

type QueueStore = {
  projects: {
    [project: string]: {
      queues: Map<QueryKey, QueueDataType<RequestInstance>>;
      searchTerm: string;
      detailsQueryKey: string | null;
    };
  };
  initialize: (projectName: string) => void;
  setQueue: (data: { project: string; data: QueueDataType<RequestInstance> }) => void;
  setSearchTerm: (project: string, searchTerm: string) => void;
  openDetails: (project: string, queryKey: QueryKey) => void;
};

export const useQueueStore = create<QueueStore>((set) => ({
  projects: {},
  initialize: (projectName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[projectName] = {
          queues: new Map(),
          detailsQueryKey: null,
          searchTerm: "",
        };
      }),
    );
  },
  setQueue: async ({ project, data }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = {
            queues: new Map(),
            detailsQueryKey: null,
            searchTerm: "",
          };
        }

        // Update queues
        draft.projects[project].queues.set(data.queryKey, data);
      }),
    );
  },
  setSearchTerm: (project: string, searchTerm: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[project].searchTerm = searchTerm;
      }),
    );
  },
  openDetails: (project: string, queryKey: QueryKey) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[project].detailsQueryKey = queryKey;
      }),
    );
  },
}));
