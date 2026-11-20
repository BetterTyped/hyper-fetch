import type { QueueDataType, RequestInstance } from "@hyper-fetch/core";
import { create } from "zustand/react";

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

export const useQueueStore = create<QueueStore>((set) => {
  // Queues change on every request, so updates copy only what changed (see the network store)
  const updateApplication = (
    application: string,
    update: (app: QueueStore["applications"][string]) => QueueStore["applications"][string],
  ) => {
    set((state) => {
      const current = state.applications[application];
      const next = update(current);
      if (next === current) {
        return state;
      }
      return { applications: { ...state.applications, [application]: next } };
    });
  };

  return {
    applications: {},
    initialize: (application) => {
      set((state) => ({ applications: { ...state.applications, [application]: getInitialState() } }));
    },
    setQueue: ({ application, data }) => {
      updateApplication(application, (app) => {
        if (app.queues.get(data.queryKey) === data) {
          return app;
        }
        const queues = new Map(app.queues);
        queues.set(data.queryKey, data);
        return { ...app, queues };
      });
    },
    setSearchTerm: (application, searchTerm) => {
      updateApplication(application, (app) => ({ ...app, searchTerm }));
    },
    openDetails: (application, queryKey) => {
      updateApplication(application, (app) => ({ ...app, detailsId: queryKey }));
    },
    closeDetails: (application) => {
      updateApplication(application, (app) => ({ ...app, detailsId: null }));
    },
    addLoadingKey: ({ application, queryKey }) => {
      updateApplication(application, (app) => {
        if (app.loadingKeys.has(queryKey)) {
          return app;
        }
        return { ...app, loadingKeys: new Set(app.loadingKeys).add(queryKey) };
      });
    },
    removeLoadingKey: ({ application, queryKey }) => {
      updateApplication(application, (app) => {
        if (!app.loadingKeys.has(queryKey)) {
          return app;
        }
        const loadingKeys = new Set(app.loadingKeys);
        loadingKeys.delete(queryKey);
        return { ...app, loadingKeys };
      });
    },
  };
});
