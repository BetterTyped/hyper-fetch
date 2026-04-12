import type { RequiredKeys } from "@hyper-fetch/core";

import type { UseQueueOptionsType } from "hooks/use-queue";

export const useQueueDefaultOptions: RequiredKeys<UseQueueOptionsType> = {
  dispatcherType: "auto",
  keepFinishedRequests: false,
};
