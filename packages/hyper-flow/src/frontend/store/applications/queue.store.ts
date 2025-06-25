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
      loadingKeys: Set<QueryKey>;
    };
  };
  initialize: (applicationName: string) => void;
  setQueue: (data: { application: string; data: QueueDataType<RequestInstance> }) => void;
  setSearchTerm: (application: string, searchTerm: string) => void;
  openDetails: (application: string, queryKey: QueryKey) => void;
  closeDetails: (application: string) => void;
  addLoadingKey: (data: { application: string; queryKey: QueryKey }) => void;
  removeLoadingKey: (data: { application: string; queryKey: QueryKey }) => void;
};

const getInitialState = (): QueueStore["applications"][string] => ({
  queues: new Map(),
  detailsId: null,
  searchTerm: "",
  loadingKeys: new Set(),
});

export const useQueueStore = create<QueueStore>((set) => ({
  applications: {},
  initialize: (applicationName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[applicationName] = getInitialState();
      }),
    );
  },
  setQueue: async ({ application, data }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
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
  addLoadingKey: ({ application, queryKey }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        draft.applications[application].loadingKeys.add(queryKey);
      }),
    );
  },
  removeLoadingKey: ({ application, queryKey }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        draft.applications[application].loadingKeys.delete(queryKey);
      }),
    );
  },
}));
