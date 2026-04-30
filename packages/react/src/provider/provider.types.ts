import type { RequestInstance } from "@hyper-fetch/core";
import type { UseCacheOptionsType } from "hooks/use-cache";
import type { UseEmitterOptionsType } from "hooks/use-emitter";
import type { UseFetchOptionsType } from "hooks/use-fetch";
import type { UseListenerOptionsType } from "hooks/use-listener";
import type { UseQueueOptionsType } from "hooks/use-queue";
import type { UseSubmitOptionsType } from "hooks/use-submit";
import type React from "react";

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
