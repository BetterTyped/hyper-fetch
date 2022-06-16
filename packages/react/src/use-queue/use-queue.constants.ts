import { RequiredKeys } from "@better-typed/hyper-fetch";
import { UseQueueOptions } from "use-queue";

export const useQueueDefaultOptions: RequiredKeys<UseQueueOptions> = {
  queueType: "auto",
};
