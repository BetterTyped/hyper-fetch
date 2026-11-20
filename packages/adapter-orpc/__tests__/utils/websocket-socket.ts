import type { AppManager } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import type { StandardRPCCustomJsonSerializer } from "@orpc/client/standard";

import type { OrpcWebsocketAdapterOptionsType, OrpcWebsocketAdapterType } from "../../src/websocket-adapter";
import { OrpcWebsocketAdapter } from "../../src/websocket-adapter";
import type { Planet } from "./stream-socket";

export const websocketUrl = "ws://localhost:3000/rpc";

export const createWebsocketSocket = ({
  adapterOptions,
  reconnect,
  reconnectTime,
  connectionTimeout,
  appManager,
  customJsonSerializers,
  adapter = OrpcWebsocketAdapter({ customJsonSerializers }),
}: {
  adapterOptions?: OrpcWebsocketAdapterOptionsType;
  reconnect?: number;
  reconnectTime?: number;
  connectionTimeout?: number;
  appManager?: AppManager;
  adapter?: OrpcWebsocketAdapterType;
  customJsonSerializers?: StandardRPCCustomJsonSerializer[];
} = {}) => {
  const socket = new Socket({
    url: websocketUrl,
    adapter,
    adapterOptions,
    reconnect,
    reconnectTime,
    connectionTimeout,
    appManager: appManager && (() => appManager),
  });
  const errors: Error[] = [];
  socket.events.onError(({ error }) => {
    errors.push(error as Error);
  });

  const onUpdate = socket.createListener<Planet, { id: number }>()({ topic: "planet/onUpdate" });

  return { socket, errors, onUpdate };
};
