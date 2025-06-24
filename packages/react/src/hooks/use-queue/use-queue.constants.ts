import { RequiredKeys } from "@hyper-fetch/core";

import { UseQueueOptionsType } from "hooks/use-queue";

export const useQueueDefaultOptions: RequiredKeys<UseQueueOptionsType> = {
  dispatcherType: "auto",
  keepFinishedRequests: false,
};
