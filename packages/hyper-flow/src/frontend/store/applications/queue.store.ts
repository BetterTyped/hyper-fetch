import { produce } from "immer";
import { create } from "zustand/react";
import { QueueDataType, RequestInstance } from "@hyper-fetch/core";

type QueryKey = string;

type QueueStore = {
  applications: {
    [application: string]: {
      queues: Map<QueryKey, QueueDataType<RequestInstance>>;
      searchTerm: string;
      detailsId: string | null;
    };
  };
  initialize: (applicationName: string) => void;
  setQueue: (data: { application: string; data: QueueDataType<RequestInstance> }) => void;
  setSearchTerm: (application: string, searchTerm: string) => void;
  openDetails: (application: string, queryKey: QueryKey) => void;
  closeDetails: (application: string) => void;
};

export const useQueueStore = create<QueueStore>((set) => ({
  applications: {},
  initialize: (applicationName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[applicationName] = {
          queues: new Map(),
          detailsId: null,
          searchTerm: "",
        };
      }),
    );
  },
  setQueue: async ({ application, data }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = {
            queues: new Map(),
            detailsId: null,
            searchTerm: "",
          };
        }

        // Update queues
        draft.applications[application].queues.set(data.queryKey, data);
      }),
    );
  },
  setSearchTerm: (application: string, searchTerm: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application].searchTerm = searchTerm;
      }),
    );
  },
  openDetails: (application: string, queryKey: QueryKey) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application].detailsId = queryKey;
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
}));
