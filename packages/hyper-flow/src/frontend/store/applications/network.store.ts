import { create } from "zustand/react";

import { useApplications } from "./apps.store";
import type { DevtoolsRequestEvent, Sort } from "@/context/applications/types";
import type { Status } from "@/utils/request.status.utils";

export type NetworkStore = {
  networkSearchTerm: string;
  networkSort: Sort | null;
  networkFilter: Status | null;
  requests: DevtoolsRequestEvent[];
  detailsRequestId: string | null;
};

const getInitialState = (): NetworkStore => ({
  networkSearchTerm: "",
  networkSort: null,
  networkFilter: null,
  requests: [],
  detailsRequestId: null,
});

export const useNetworkStore = create<{
  applications: { [application: string]: NetworkStore };
  initialize: (applicationName: string) => void;
  setNetworkSearchTerm: (data: { application: string; searchTerm: string }) => void;
  setNetworkSort: (data: { application: string; sorting: Sort | null }) => void;
  setNetworkFilter: (data: { application: string; filter: Status | null }) => void;
  /** List a request, or merge into it when it is already listed (it is listed once queued, again when sent). */
  setNetworkRequest: (data: { application: string; data: DevtoolsRequestEvent }) => void;
  /** Mark queued requests of a stopped queue as paused, or as running again once the queue starts. */
  setPausedRequests: (data: { application: string; requestIds: string[]; paused: boolean }) => void;
  setNetworkResponse: (data: { application: string; data: DevtoolsRequestEvent }) => void;
  /** Merge a lifecycle change into a listed request, so later events don't erase what earlier ones recorded. */
  updateNetworkRequest: (data: {
    application: string;
    requestId: string;
    update: Partial<Omit<DevtoolsRequestEvent, "requestId">>;
  }) => void;
  clearNetwork: (data: { application: string }) => void;
  removeNetworkRequest: (data: { application: string; requestId: string }) => void;
  openDetails: (data: { application: string; requestId: string }) => void;
  closeDetails: (application: string) => void;
}>((set) => {
  /**
   * Requests stream in many events per second, so updates copy only what changed: unchanged requests keep their
   * identity, and the list rows rendering them can skip re-rendering. (Immer re-walked the whole history per event.)
   */
  const updateApplication = (application: string, update: (app: NetworkStore) => NetworkStore) => {
    set((state) => {
      const current = state.applications[application];
      const next = update(current);
      if (next === current) {
        return state;
      }
      return { applications: { ...state.applications, [application]: next } };
    });
  };

  const updateRequest = (
    app: NetworkStore,
    requestId: string | undefined,
    update: (request: DevtoolsRequestEvent) => DevtoolsRequestEvent,
  ): NetworkStore => {
    const index = app.requests.findIndex((request) => request.requestId === requestId);
    // The request may have been cleared from the list or dropped by the history limit
    if (index === -1) {
      return app;
    }
    const requests = [...app.requests];
    requests[index] = update(requests[index]);
    return { ...app, requests };
  };

  return {
    applications: {},
    initialize: (application) => {
      set((state) => ({ applications: { ...state.applications, [application]: getInitialState() } }));
    },
    setNetworkSearchTerm: ({ application, searchTerm }) => {
      updateApplication(application, (app) => ({ ...app, networkSearchTerm: searchTerm }));
    },
    setNetworkSort: ({ application, sorting }) => {
      updateApplication(application, (app) => ({ ...app, networkSort: sorting }));
    },
    setNetworkFilter: ({ application, filter }) => {
      updateApplication(application, (app) => ({ ...app, networkFilter: filter }));
    },
    setNetworkRequest: ({ application, data }) => {
      updateApplication(application, (app) => {
        if (app.requests.some((request) => request.requestId === data.requestId)) {
          return updateRequest(app, data.requestId, (existing) => ({
            ...existing,
            ...data,
            timestamp: existing.timestamp,
          }));
        }
        const maxRequestsHistorySize =
          useApplications.getState().applications[application]?.settings.maxRequestsHistorySize ?? 1000;
        const limit = Math.max(maxRequestsHistorySize, 1);
        return { ...app, requests: [data, ...app.requests].slice(0, limit) };
      });
    },
    setNetworkResponse: ({ application, data }) => {
      updateApplication(application, (app) =>
        updateRequest(app, data.requestId, (existing) => ({ ...existing, ...data })),
      );
    },
    setPausedRequests: ({ application, requestIds, paused }) => {
      if (!requestIds.length) {
        return;
      }
      updateApplication(application, (app) => {
        let changed = false;
        const requests = app.requests.map((request) => {
          const matches = !!request.requestId && requestIds.includes(request.requestId) && !request.isFinished;
          if (!matches || request.isPaused === paused) {
            return request;
          }
          changed = true;
          return { ...request, isPaused: paused };
        });
        return changed ? { ...app, requests } : app;
      });
    },
    updateNetworkRequest: ({ application, requestId, update }) => {
      updateApplication(application, (app) =>
        updateRequest(app, requestId, (existing) => ({ ...existing, ...update })),
      );
    },
    clearNetwork: ({ application }) => {
      // Keep how the user looks at the list, drop only what is in it
      updateApplication(application, (app) => ({ ...app, requests: [], detailsRequestId: null }));
    },
    openDetails: ({ application, requestId }) => {
      updateApplication(application, (app) => ({ ...app, detailsRequestId: requestId }));
    },
    removeNetworkRequest: ({ application, requestId }) => {
      updateApplication(application, (app) => ({
        ...app,
        requests: app.requests.filter((request) => request.requestId !== requestId),
        detailsRequestId: null,
      }));
    },
    closeDetails: (application) => {
      updateApplication(application, (app) => ({ ...app, detailsRequestId: null }));
    },
  };
});
