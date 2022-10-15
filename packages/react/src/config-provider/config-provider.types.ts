import React from "react";
import { CommandInstance } from "@hyper-fetch/core";

import { UseFetchOptionsType } from "hooks/use-fetch";
import { UseSubmitOptionsType } from "hooks/use-submit";
import { UseCacheOptionsType } from "hooks/use-cache";
import { UseQueueOptionsType } from "hooks/use-queue";

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
