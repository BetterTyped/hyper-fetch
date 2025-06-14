export type WebsocketAdapterOptionsType = {
  protocols?: string[];
  pingTimeout?: number;
  pongTimeout?: number;
  heartbeatMessage?: string;
  heartbeat?: boolean;
  autoConnect?: boolean;
};
