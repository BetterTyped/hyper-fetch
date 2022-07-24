import React from "react";
import { CommandInstance } from "@better-typed/hyper-fetch";

import { UseFetchOptionsType } from "use-fetch";
import { UseSubmitOptionsType } from "use-submit";
import { UseCacheOptionsType } from "use-cache";
import { UseQueueOptionsType } from "use-queue";

export type ConfigProviderOptionsType = {
  useFetchConfig?: Partial<UseFetchOptionsType<CommandInstance>>;
  useSubmitConfig?: Partial<UseSubmitOptionsType<CommandInstance>>;
  useCacheConfig?: Partial<UseCacheOptionsType<CommandInstance>>;
  useQueueConfig?: Partial<UseQueueOptionsType>;
};

export type ConfigProviderProps = {
  children: React.ReactNode;
  config?: ConfigProviderOptionsType;
};

export type ConfigProviderValueType = [ConfigProviderOptionsType, (newConfig: ConfigProviderOptionsType) => void];
