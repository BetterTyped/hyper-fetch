import type { RequestInstance } from "@hyper-fetch/core";
import type { UseCacheOptionsType } from "hooks/use-cache";
import type { UseEmitterOptionsType } from "hooks/use-emitter";
import type { UseFetchOptionsType } from "hooks/use-fetch";
import type { UseListenerOptionsType } from "hooks/use-listener";
import type { UseQueueOptionsType } from "hooks/use-queue";
import type { UseSubmitOptionsType } from "hooks/use-submit";
import type React from "react";

// Omit applied to every union member - keeps the bounce options discriminated union intact
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type ProviderOptionsType = {
  // Selectors are component specific, they cannot be configured globally
  useFetchConfig?: Partial<DistributiveOmit<UseFetchOptionsType<RequestInstance>, "select">>;
  useSubmitConfig?: Partial<DistributiveOmit<UseSubmitOptionsType<RequestInstance>, "select">>;
  useCacheConfig?: Partial<Omit<UseCacheOptionsType<RequestInstance>, "select">>;
  useQueueConfig?: Partial<UseQueueOptionsType>;
  useListener?: Partial<Omit<UseListenerOptionsType, "select">>;
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
