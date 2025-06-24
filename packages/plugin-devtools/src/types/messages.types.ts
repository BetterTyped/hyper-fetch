import { AdapterInstance, ClientInstance, ClientOptionsType, ExtractAdapterOptionsType } from "@hyper-fetch/core";

import { CoreEvents, CustomEvents, EventSourceType, InternalEvents } from "./events.types";

export enum MessageType {
  INTERNAL = "INTERNAL",
  EVENT = "EVENT",
}

export enum MessageOrigin {
  PLUGIN = "PLUGIN",
  APP = "APP",
}

export interface BaseMessagePayload {
  messageType: MessageType;
  eventType?: InternalEvents | CoreEvents | CustomEvents;
  connectionName: string;
  eventData?: any;
  origin: MessageOrigin;
  [x: string]: any;
}

export interface PluginInternalMessagePayload extends BaseMessagePayload {
  messageType: MessageType.INTERNAL;
  eventType: InternalEvents.PLUGIN_INITIALIZED | InternalEvents.PLUGIN_HANGUP;
  eventData: {
    clientOptions: ClientOptionsType<ClientInstance>;
    adapterOptions: ExtractAdapterOptionsType<AdapterInstance>;
    environment: string;
  };
  connectionName: string;
  origin: MessageOrigin.PLUGIN;
}

export interface AppInternalMessagePayload extends BaseMessagePayload {
  messageType: MessageType.INTERNAL;
  eventType: InternalEvents.APP_INITIALIZED;
  connectionName: string;
  eventData: any;
  origin: MessageOrigin.APP;
}

export interface HFEventMessagePayload extends BaseMessagePayload {
  messageType: MessageType.EVENT;
  eventSource: EventSourceType;
  connectionName: string;
  eventName: string;
  eventType?: CoreEvents | CustomEvents;
  eventData: any;
}

export type AppInternalMessage = {
  data: AppInternalMessagePayload;
};

export type PluginInternalMessage = {
  data: PluginInternalMessagePayload;
};

// Unify data and payload words
export type HFEventMessage = {
  data: HFEventMessagePayload;
};

export type Message = HFEventMessage | PluginInternalMessage | AppInternalMessage;
