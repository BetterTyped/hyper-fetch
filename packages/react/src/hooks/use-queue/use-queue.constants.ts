import { RequiredKeys } from "@better-typed/hyper-fetch";

import { UseQueueOptionsType } from "hooks/use-queue";

export const useQueueDefaultOptions: RequiredKeys<UseQueueOptionsType> = {
  queueType: "auto",
};
