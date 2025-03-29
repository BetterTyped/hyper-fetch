import { Updater } from "use-immer";
import { QueueDataType, RequestInstance } from "@hyper-fetch/core";

import {
  DevtoolsRequestResponse,
  DevtoolsRequestEvent,
  DevtoolsElement,
  DevtoolsRequestQueueStats,
  DevtoolsCacheEvent,
  Sort,
} from "../types";
import { Status } from "frontend/utils/request.status.utils";
import { createContext } from "frontend/utils/context";
import { DevtoolsExplorerRequest } from "frontend/pages/project/requests/list/content.types";

export type ProjectState = {
  isOnline: boolean;
  networkSearchTerm: string;
  networkSort: Sort | null;
  requests: DevtoolsRequestEvent[];
  success: DevtoolsRequestResponse[];
  failed: DevtoolsRequestResponse[];
  removed: DevtoolsElement[];
  inProgress: DevtoolsElement[];
  paused: DevtoolsElement[];
  canceled: DevtoolsElement[];
  detailsRequestId: string | null;
  networkFilter: Status | null;
  cacheSearchTerm: string;
  cacheSort: Sort | null;
  cache: DevtoolsCacheEvent[];
  detailsCacheKey: string | null;
  loadingKeys: string[];
  processingSearchTerm: string;
  processingSort: Sort | null;
  queues: QueueDataType[];
  detailsQueueKey: string | null;
  stats: {
    [queryKey: string]: DevtoolsRequestQueueStats;
  };
  explorerSearchTerm: string;
  detailsExplorerRequest: DevtoolsExplorerRequest | null;
  explorerRequests: RequestInstance[];
};

type ProjectStateContextType = {
  projectStates: {
    [key: string]: ProjectState;
  };
  setProjectStates: Updater<{
    [key: string]: ProjectState;
  }>;
};

export const [ProjectStatesContext, useProjectStates] = createContext<ProjectStateContextType>("ProjectStateProvider", {
  projectStates: {},
  setProjectStates: () => {},
});

export const initialProjectState: ProjectState = {
  isOnline: false,
  networkSearchTerm: "",
  networkSort: null,
  requests: [],
  success: [],
  failed: [],
  removed: [],
  inProgress: [],
  paused: [],
  canceled: [],
  detailsRequestId: null,
  networkFilter: null,
  cacheSearchTerm: "",
  cacheSort: null,
  cache: [],
  detailsCacheKey: null,
  loadingKeys: [],
  processingSearchTerm: "",
  processingSort: null,
  queues: [],
  detailsQueueKey: null,
  stats: {},
  explorerSearchTerm: "",
  detailsExplorerRequest: null,
  explorerRequests: [],
};
