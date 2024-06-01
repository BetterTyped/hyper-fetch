import React from "react";
import { ClientInstance, RequestInstance, HydrateDataType, HydrationOptions } from "@hyper-fetch/core";

import { UseSubmitOptionsType } from "hooks/use-submit";
import { UseCacheOptionsType } from "hooks/use-cache";
import { UseQueueOptionsType } from "hooks/use-queue";
import { UseListenerOptionsType } from "hooks/use-listener";
import { UseEmitterOptionsType } from "hooks/use-emitter";
import { UseEventMessagesOptionsType } from "hooks/use-event-messages";
import { UseFetchOptionsType } from "hooks/use-fetch";

export type ProviderOptionsType<SocketResponses = any> = {
  useFetchConfig?: Partial<UseFetchOptionsType<RequestInstance>>;
  useSubmitConfig?: Partial<UseSubmitOptionsType<RequestInstance>>;
  useCacheConfig?: Partial<UseCacheOptionsType<RequestInstance>>;
  useQueueConfig?: Partial<UseQueueOptionsType>;
  useListener?: Partial<UseListenerOptionsType>;
  useEmitter?: Partial<UseEmitterOptionsType>;
  useEventMessages?: Partial<UseEventMessagesOptionsType<SocketResponses>>;
};

export type ProviderProps<Client extends ClientInstance = ClientInstance> = {
  /**
   * Instance of the Client
   */
  client: Client;
  /**
   * Children to render
   */
  children: React.ReactNode;
  /**
   * Configuration to set for available hooks
   */
  config?: ProviderOptionsType;
  /**
   * Fallbacks to hydrate for particular requests
   */
  hydrationData?: HydrateDataType[];
  /**
   * Hydration configuration
   */
  hydrationConfig?: HydrationOptions;
};

export type ProviderValueType = {
  config: ProviderOptionsType;
  setConfig: (newConfig: ProviderOptionsType) => void;
  hydrationData?: HydrateDataType[];
};
