import { produce } from "immer";
import { create } from "zustand/react";
import { QueueDataType, RequestInstance } from "@hyper-fetch/core";

type QueryKey = string;

type QueueStore = {
  projects: {
    [project: string]: {
      queues: Map<QueryKey, QueueDataType<RequestInstance>>;
      detailsQueryKey: string | null;
    };
  };
  initialize: (projectName: string) => void;
  setQueue: (data: { project: string; data: QueueDataType<RequestInstance> }) => void;
};

export const useQueueStore = create<QueueStore>((set) => ({
  projects: {},
  initialize: (projectName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[projectName] = {
          queues: new Map(),
          detailsQueryKey: null,
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
          };
        }

        // Update queues
        draft.projects[project].queues.set(data.queryKey, data);
      }),
    );
  },
}));
