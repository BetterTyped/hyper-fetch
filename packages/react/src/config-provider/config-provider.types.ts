import React from "react";
import { ClientInstance, RequestInstance, HydrateDataType, HydrationOptions } from "@hyper-fetch/core";

import { UseSubmitOptionsType } from "hooks/use-submit";
import { UseCacheOptionsType } from "hooks/use-cache";
import { UseQueueOptionsType } from "hooks/use-queue";
import { UseListenerOptionsType } from "hooks/use-listener";
import { UseEmitterOptionsType } from "hooks/use-emitter";
import { UseEventMessagesOptionsType } from "hooks/use-event-messages";
import { UseFetchOptionsType } from "hooks/use-fetch";

export type ConfigProviderOptionsType<SocketResponses = any> = {
  useFetchConfig?: Partial<UseFetchOptionsType<RequestInstance>>;
  useSubmitConfig?: Partial<UseSubmitOptionsType<RequestInstance>>;
  useCacheConfig?: Partial<UseCacheOptionsType<RequestInstance>>;
  useQueueConfig?: Partial<UseQueueOptionsType>;
  useListener?: Partial<UseListenerOptionsType>;
  useEmitter?: Partial<UseEmitterOptionsType>;
  useEventMessages?: Partial<UseEventMessagesOptionsType<SocketResponses>>;
};

export type ConfigProviderProps<Client extends ClientInstance = ClientInstance> = {
  client: Client;
  fallbacks?: HydrateDataType<string>[];
  fallbacksConfig?: HydrationOptions;
  children: React.ReactNode;
  config?: ConfigProviderOptionsType;
};

export type ConfigProviderValueType = {
  config: ConfigProviderOptionsType;
  setConfig: (newConfig: ConfigProviderOptionsType) => void;
  fallbacks?: HydrateDataType<string>[];
};
