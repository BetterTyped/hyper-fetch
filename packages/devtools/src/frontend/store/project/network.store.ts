import { produce } from "immer";
import { create } from "zustand/react";

import { Status } from "frontend/utils/request.status.utils";
import { DevtoolsRequestEvent, Sort } from "frontend/context/projects/types";
import { useProjects } from "./projects.store";

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
  projects: { [project: string]: NetworkStore };
  initialize: (projectName: string) => void;
  setNetworkSearchTerm: (data: { project: string; searchTerm: string }) => void;
  setNetworkSort: (data: { project: string; sorting: Sort | null }) => void;
  setNetworkFilter: (data: { project: string; filter: Status | null }) => void;
  setNetworkRequest: (data: { project: string; data: DevtoolsRequestEvent }) => void;
  setNetworkResponse: (data: { project: string; data: DevtoolsRequestEvent }) => void;
  clearNetwork: (data: { project: string }) => void;
  removeNetworkRequest: (data: { project: string; requestId: string }) => void;
  openDetails: (data: { project: string; requestId: string }) => void;
  closeDetails: (project: string) => void;
}>((set) => ({
  projects: {},
  initialize: (projectName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[projectName] = getInitialState();
      }),
    );
  },
  setNetworkSearchTerm: ({ project, searchTerm }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getInitialState();
        }
        draft.projects[project].networkSearchTerm = searchTerm;
      }),
    );
  },
  setNetworkSort: ({ project, sorting }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getInitialState();
        }
        draft.projects[project].networkSort = sorting;
      }),
    );
  },
  setNetworkFilter: ({ project, filter }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getInitialState();
        }
        draft.projects[project].networkFilter = filter;
      }),
    );
  },
  setNetworkRequest: ({ project, data }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.projects[project]) {
          draft.projects[project] = getInitialState();
        }
        const { maxRequestsHistorySize } = useProjects.getState().projects[project].settings;
        if (draft.projects[project].requests.length >= maxRequestsHistorySize) {
          draft.projects[project].requests.pop();
        }
        draft.projects[project].requests.unshift(data);
      }),
    );
  },
  setNetworkResponse: ({ project, data }) => {
    set((state) =>
      produce(state, (draft) => {
        const index = draft.projects[project].requests.findIndex((request) => request.requestId === data.requestId);
        if (index !== -1) {
          draft.projects[project].requests[index] = data;
        } else {
          console.error(`Request with id ${data.requestId} not found`);
        }
      }),
    );
  },
  clearNetwork: ({ project }) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[project] = getInitialState();
      }),
    );
  },
  openDetails: ({ project, requestId }) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[project].detailsRequestId = requestId;
      }),
    );
  },
  removeNetworkRequest: ({ project, requestId }) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[project].requests = draft.projects[project].requests.filter(
          (request) => request.requestId !== requestId,
        );
        draft.projects[project].detailsRequestId = null;
      }),
    );
  },
  closeDetails: (project: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.projects[project].detailsRequestId = null;
      }),
    );
  },
}));
