import type { AppManager } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import type { StandardRPCCustomJsonSerializer } from "@orpc/client/standard";

import { createOrpcSerializer } from "../../src/adapter";
import type { OrpcStreamAdapterOptionsType, OrpcStreamAdapterType } from "../../src/stream-adapter";
import { OrpcStreamAdapter } from "../../src/stream-adapter";

export type Planet = { id: number; name: string };

export const streamUrl = "http://localhost:3000/rpc";

/** The value in the `{ json, meta }` form the server sends */
export const serialize = (value: unknown, customJsonSerializers?: StandardRPCCustomJsonSerializer[]) => {
  return createOrpcSerializer(customJsonSerializers).serialize(value);
};

export const createStreamSocket = ({
  adapterOptions,
  reconnect,
  reconnectTime,
  connectionTimeout,
  appManager,
  customJsonSerializers,
  adapter = OrpcStreamAdapter({ customJsonSerializers }),
  url = streamUrl,
}: {
  adapterOptions?: OrpcStreamAdapterOptionsType;
  reconnect?: number;
  reconnectTime?: number;
  connectionTimeout?: number;
  appManager?: AppManager;
  adapter?: OrpcStreamAdapterType;
  customJsonSerializers?: StandardRPCCustomJsonSerializer[];
  url?: string;
} = {}) => {
  const socket = new Socket({
    url,
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
