import { WebSocket } from "ws";

export enum AppConnectionStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  INITIALIZED = "INITIALIZED",
}

export enum PluginConnectionStatus {
  CONNECTED = "CONNECTED",
  HANGUP = "HANGUP",
}

export type ConnectionMap = Record<
  string, // connectionName
  {
    ws: WebSocket | null;
    appStatus: AppConnectionStatus;
    events?: any[];
    pluginStatus: PluginConnectionStatus;
    clientMetaData?: any;
  }
>;
