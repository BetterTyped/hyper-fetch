import { RequestInstance } from "@hyper-fetch/core";
import React from "react";

import { UseSubmitOptionsType } from "hooks/use-submit";
import { UseCacheOptionsType } from "hooks/use-cache";
import { UseQueueOptionsType } from "hooks/use-queue";
import { UseListenerOptionsType } from "hooks/use-listener";
import { UseEmitterOptionsType } from "hooks/use-emitter";
import { UseFetchOptionsType } from "hooks/use-fetch";

export type ProviderOptionsType = {
  useFetchConfig?: Partial<UseFetchOptionsType<RequestInstance>>;
  useSubmitConfig?: Partial<UseSubmitOptionsType<RequestInstance>>;
  useCacheConfig?: Partial<UseCacheOptionsType<RequestInstance>>;
  useQueueConfig?: Partial<UseQueueOptionsType>;
  useListener?: Partial<UseListenerOptionsType>;
  useEmitter?: Partial<UseEmitterOptionsType>;
};

export type ProviderProps = {
  /**
   * Children to render
   */
  children: React.ReactNode;
  /**
   * Configuration to set for available hooks
   */
  config?: ProviderOptionsType;
};

export type ProviderValueType = {
  config: ProviderOptionsType;
  setConfig: (newConfig: ProviderOptionsType) => void;
};
