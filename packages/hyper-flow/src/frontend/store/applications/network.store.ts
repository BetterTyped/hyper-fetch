import { produce } from "immer";
import { create } from "zustand/react";

import { useApplications } from "./apps.store";

import { Status } from "@/utils/request.status.utils";
import { DevtoolsRequestEvent, Sort } from "@/context/applications/types";

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
  setNetworkRequest: (data: { application: string; data: DevtoolsRequestEvent }) => void;
  setNetworkResponse: (data: { application: string; data: DevtoolsRequestEvent }) => void;
  clearNetwork: (data: { application: string }) => void;
  removeNetworkRequest: (data: { application: string; requestId: string }) => void;
  openDetails: (data: { application: string; requestId: string }) => void;
  closeDetails: (application: string) => void;
}>((set) => ({
  applications: {},
  initialize: (applicationName: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[applicationName] = getInitialState();
      }),
    );
  },
  setNetworkSearchTerm: ({ application, searchTerm }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        draft.applications[application].networkSearchTerm = searchTerm;
      }),
    );
  },
  setNetworkSort: ({ application, sorting }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        draft.applications[application].networkSort = sorting;
      }),
    );
  },
  setNetworkFilter: ({ application, filter }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        draft.applications[application].networkFilter = filter;
      }),
    );
  },
  setNetworkRequest: ({ application, data }) => {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.applications[application]) {
          draft.applications[application] = getInitialState();
        }
        const { maxRequestsHistorySize } = useApplications.getState().applications[application].settings;
        if (draft.applications[application].requests.length >= maxRequestsHistorySize) {
          draft.applications[application].requests.pop();
        }
        draft.applications[application].requests.unshift(data);
      }),
    );
  },
  setNetworkResponse: ({ application, data }) => {
    set((state) =>
      produce(state, (draft) => {
        const index = draft.applications[application].requests.findIndex(
          (request) => request.requestId === data.requestId,
        );
        if (index !== -1) {
          draft.applications[application].requests[index] = data;
        } else {
          console.error(`Request with id ${data.requestId} not found`);
        }
      }),
    );
  },
  clearNetwork: ({ application }) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application] = getInitialState();
      }),
    );
  },
  openDetails: ({ application, requestId }) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application].detailsRequestId = requestId;
      }),
    );
  },
  removeNetworkRequest: ({ application, requestId }) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application].requests = draft.applications[application].requests.filter(
          (request) => request.requestId !== requestId,
        );
        draft.applications[application].detailsRequestId = null;
      }),
    );
  },
  closeDetails: (application: string) => {
    set((state) =>
      produce(state, (draft) => {
        draft.applications[application].detailsRequestId = null;
      }),
    );
  },
}));
