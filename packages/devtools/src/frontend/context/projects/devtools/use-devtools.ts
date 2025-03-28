import { useCallback, useMemo, SetStateAction } from "react";
import { QueueDataType, RequestInstance } from "@hyper-fetch/core";

import {
  DevtoolsRequestEvent,
  DevtoolsRequestResponse,
  DevtoolsElement,
  DevtoolsCacheEvent,
  DevtoolsRequestQueueStats,
  Sort,
} from "../types";
import { useProjectStates } from "../state/state.context";
import { DevtoolsExplorerRequest } from "frontend/pages/project/requests/list/content.types";
import { Status } from "frontend/utils/request.status.utils";
import { useConnections } from "../connection/connection";
import { useRoute } from "frontend/routing/router";
import { useProjects } from "frontend/store/projects.store";

export const useDevtools = () => {
  const { params } = useRoute("projects.details");
  const { projectStates, setProjectStates } = useProjectStates("Devtools");
  const { connections } = useConnections("Devtools");
  const { projects } = useProjects();

  const { projectName } = params;

  const { client } = connections[projectName as keyof typeof connections];
  const { requests, canceled, success, failed, paused, removed } =
    projectStates[projectName as keyof typeof projectStates];

  const setRequests = useCallback((newRequests: SetStateAction<DevtoolsRequestEvent[]>) => {
    setProjectStates((draft) => {
      draft[projectName].requests =
        typeof newRequests === "function"
          ? newRequests(draft[projectName].requests as DevtoolsRequestEvent[])
          : newRequests;
    });
  }, []);

  const setSuccess = useCallback((newSuccess: SetStateAction<DevtoolsRequestResponse[]>) => {
    setProjectStates((draft) => {
      draft[projectName].success =
        typeof newSuccess === "function" ? newSuccess(draft[projectName].success) : newSuccess;
    });
  }, []);

  const setFailed = useCallback((newFailed: SetStateAction<DevtoolsRequestResponse[]>) => {
    setProjectStates((draft) => {
      draft[projectName].failed = typeof newFailed === "function" ? newFailed(draft[projectName].failed) : newFailed;
    });
  }, []);

  const setInProgress = useCallback((newInProgress: SetStateAction<DevtoolsElement[]>) => {
    setProjectStates((draft) => {
      draft[projectName].inProgress =
        typeof newInProgress === "function" ? newInProgress(draft[projectName].inProgress) : newInProgress;
    });
  }, []);

  const setPaused = useCallback((newPaused: SetStateAction<DevtoolsElement[]>) => {
    setProjectStates((draft) => {
      draft[projectName].paused = typeof newPaused === "function" ? newPaused(draft[projectName].paused) : newPaused;
    });
  }, []);

  const setCanceled = useCallback(
    (newCanceled: DevtoolsElement[] | ((prev: DevtoolsElement[]) => DevtoolsElement[])) => {
      setProjectStates((draft) => {
        draft[projectName].canceled =
          typeof newCanceled === "function" ? newCanceled(draft[projectName].canceled) : newCanceled;
      });
    },
    [],
  );

  const setRemoved = useCallback((newRemoved: DevtoolsElement[] | ((prev: DevtoolsElement[]) => DevtoolsElement[])) => {
    setProjectStates((draft) => {
      draft[projectName].removed =
        typeof newRemoved === "function" ? newRemoved(draft[projectName].removed) : newRemoved;
    });
  }, []);

  const setCache = useCallback(
    (newCache: DevtoolsCacheEvent[] | ((prev: DevtoolsCacheEvent[]) => DevtoolsCacheEvent[])) => {
      setProjectStates((draft) => {
        draft[projectName].cache = typeof newCache === "function" ? newCache(draft[projectName].cache) : newCache;
      });
    },
    [],
  );

  const setDetailsCacheKey = useCallback(
    (newDetailsCacheKey: string | null | ((prev: string | null) => string | null)) => {
      setProjectStates((draft) => {
        draft[projectName].detailsCacheKey =
          typeof newDetailsCacheKey === "function"
            ? newDetailsCacheKey(draft[projectName].detailsCacheKey)
            : newDetailsCacheKey;
      });
    },
    [],
  );

  const setLoadingKeys = useCallback((newLoadingKeys: string[] | ((prev: string[]) => string[])) => {
    setProjectStates((draft) => {
      draft[projectName].loadingKeys =
        typeof newLoadingKeys === "function" ? newLoadingKeys(draft[projectName].loadingKeys) : newLoadingKeys;
    });
  }, []);

  const setProcessingSearchTerm = useCallback((newProcessingSearchTerm: string | ((prev: string) => string)) => {
    setProjectStates((draft) => {
      draft[projectName].processingSearchTerm =
        typeof newProcessingSearchTerm === "function"
          ? newProcessingSearchTerm(draft[projectName].processingSearchTerm)
          : newProcessingSearchTerm;
    });
  }, []);

  const setProcessingSort = useCallback((newProcessingSort: Sort | null | ((prev: Sort | null) => Sort | null)) => {
    setProjectStates((draft) => {
      draft[projectName].processingSort =
        typeof newProcessingSort === "function"
          ? newProcessingSort(draft[projectName].processingSort)
          : newProcessingSort;
    });
  }, []);

  const setQueues = useCallback((newQueues: QueueDataType[] | ((prev: QueueDataType[]) => QueueDataType[])) => {
    setProjectStates((draft) => {
      draft[projectName].queues =
        typeof newQueues === "function" ? newQueues(draft[projectName].queues as QueueDataType[]) : newQueues;
    });
  }, []);

  const setDetailsQueueKey = useCallback(
    (newDetailsQueueKey: string | null | ((prev: string | null) => string | null)) => {
      setProjectStates((draft) => {
        draft[projectName].detailsQueueKey =
          typeof newDetailsQueueKey === "function"
            ? newDetailsQueueKey(draft[projectName].detailsQueueKey)
            : newDetailsQueueKey;
      });
    },
    [],
  );

  const setStats = useCallback(
    (
      newStats:
        | { [queryKey: string]: DevtoolsRequestQueueStats }
        | ((prev: { [queryKey: string]: DevtoolsRequestQueueStats }) => {
            [queryKey: string]: DevtoolsRequestQueueStats;
          }),
    ) => {
      setProjectStates((draft) => {
        draft[projectName].stats = typeof newStats === "function" ? newStats(draft[projectName].stats) : newStats;
      });
    },
    [],
  );

  const setExplorerSearchTerm = useCallback((newExplorerSearchTerm: string | ((prev: string) => string)) => {
    setProjectStates((draft) => {
      draft[projectName].explorerSearchTerm =
        typeof newExplorerSearchTerm === "function"
          ? newExplorerSearchTerm(draft[projectName].explorerSearchTerm)
          : newExplorerSearchTerm;
    });
  }, []);

  const setDetailsExplorerRequest = useCallback(
    (
      newDetailsExplorerRequest:
        | DevtoolsExplorerRequest
        | null
        | ((prev: DevtoolsExplorerRequest | null) => DevtoolsExplorerRequest | null),
    ) => {
      setProjectStates((draft) => {
        draft[projectName].detailsExplorerRequest =
          typeof newDetailsExplorerRequest === "function"
            ? newDetailsExplorerRequest(draft[projectName].detailsExplorerRequest as DevtoolsExplorerRequest)
            : newDetailsExplorerRequest;
      });
    },
    [],
  );

  const setExplorerRequests = useCallback(
    (newExplorerRequests: RequestInstance[] | ((prev: RequestInstance[]) => RequestInstance[])) => {
      setProjectStates((draft) => {
        draft[projectName].explorerRequests =
          typeof newExplorerRequests === "function"
            ? newExplorerRequests(draft[projectName].explorerRequests as RequestInstance[])
            : newExplorerRequests;
      });
    },
    [],
  );

  const setIsOnline = useCallback((isOnline: SetStateAction<boolean>) => {
    setProjectStates((draft) => {
      draft[projectName].isOnline = typeof isOnline === "function" ? isOnline(draft[projectName].isOnline) : isOnline;
    });
  }, []);

  const setNetworkSearchTerm = useCallback((newNetworkSearchTerm: SetStateAction<string>) => {
    setProjectStates((draft) => {
      draft[projectName].networkSearchTerm =
        typeof newNetworkSearchTerm === "function"
          ? newNetworkSearchTerm(draft[projectName].networkSearchTerm)
          : newNetworkSearchTerm;
    });
  }, []);

  const setNetworkSort = useCallback((newNetworkSort: SetStateAction<Sort | null>) => {
    setProjectStates((draft) => {
      draft[projectName].networkSort =
        typeof newNetworkSort === "function" ? newNetworkSort(draft[projectName].networkSort) : newNetworkSort;
    });
  }, []);

  const setDetailsRequestId = useCallback(
    (newDetailsRequestId: string | null | ((prev: string | null) => string | null)) => {
      setProjectStates((draft) => {
        draft[projectName].detailsRequestId =
          typeof newDetailsRequestId === "function"
            ? newDetailsRequestId(draft[projectName].detailsRequestId)
            : newDetailsRequestId;
      });
    },
    [],
  );

  const setNetworkFilter = useCallback((newNetworkFilter: Status | null | ((prev: Status | null) => Status | null)) => {
    setProjectStates((draft) => {
      draft[projectName].networkFilter =
        typeof newNetworkFilter === "function" ? newNetworkFilter(draft[projectName].networkFilter) : newNetworkFilter;
    });
  }, []);

  const setCacheSearchTerm = useCallback((newCacheSearchTerm: string | ((prev: string) => string)) => {
    setProjectStates((draft) => {
      draft[projectName].cacheSearchTerm =
        typeof newCacheSearchTerm === "function"
          ? newCacheSearchTerm(draft[projectName].cacheSearchTerm)
          : newCacheSearchTerm;
    });
  }, []);

  const setCacheSort = useCallback((newCacheSort: Sort | null | ((prev: Sort | null) => Sort | null)) => {
    setProjectStates((draft) => {
      draft[projectName].cacheSort =
        typeof newCacheSort === "function" ? newCacheSort(draft[projectName].cacheSort) : newCacheSort;
    });
  }, []);

  const clearNetwork = useCallback(() => {
    setRequests([]);
    setSuccess([]);
    setFailed([]);
    setInProgress([]);
    setPaused([]);
    setCanceled([]);
    setRemoved([]);
  }, []);

  const removeNetworkRequest = useCallback(
    (requestId: string) => {
      setProjectStates((draft) => {
        draft[projectName].requests = draft[projectName].requests.filter((i) => i.requestId !== requestId);
        draft[projectName].success = draft[projectName].success.filter((i) => i.requestId !== requestId);
        draft[projectName].failed = draft[projectName].failed.filter((i) => i.requestId !== requestId);
      });
    },
    [projectName, setProjectStates],
  );

  const handleSetOnline = useCallback(
    (value: boolean) => {
      client.appManager.setOnline(value);
      setIsOnline(value);
    },
    [client.appManager],
  );

  const allRequests: DevtoolsRequestEvent[] = useMemo(
    () =>
      requests.map((item) => {
        const isCanceled = !!canceled.find((el) => el.requestId === item.requestId);
        const isSuccess = !!success.find((el) => el.requestId === item.requestId);
        const isRemoved = !!removed.find((el) => el.requestId === item.requestId);
        const isPaused = !!paused.find((el) => el.requestId === item.requestId);
        const response =
          success.find((el) => el.requestId === item.requestId) || failed.find((el) => el.requestId === item.requestId);

        return {
          ...response,
          requestId: item.requestId,
          request: item.request,
          details: response?.details,
          isRemoved,
          isCanceled,
          isSuccess,
          isFinished: !!response,
          isPaused,
          triggerTimestamp: item.triggerTimestamp,
        };
      }),
    [canceled, failed, paused, removed, requests, success],
  );

  return {
    client,
    project: projects[projectName as keyof typeof projects],
    state: projectStates[projectName as keyof typeof projectStates],
    allRequests,
    clearNetwork,
    removeNetworkRequest,
    handleSetOnline,
    setRequests,
    setSuccess,
    setFailed,
    setInProgress,
    setPaused,
    setCanceled,
    setRemoved,
    setCache,
    setDetailsCacheKey,
    setLoadingKeys,
    setProcessingSearchTerm,
    setProcessingSort,
    setQueues,
    setDetailsQueueKey,
    setStats,
    setExplorerSearchTerm,
    setDetailsExplorerRequest,
    setExplorerRequests,
    setIsOnline,
    setNetworkSearchTerm,
    setNetworkSort,
    setDetailsRequestId,
    setNetworkFilter,
    setCacheSearchTerm,
    setCacheSort,
  };
};
