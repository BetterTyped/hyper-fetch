import type { ClientInstance } from "@hyper-fetch/core";
import type { AppInternalMessage, HFEventMessage } from "@hyper-fetch/plugin-devtools";
import type { EmitterInstance, ExtendEmitter, ListenerInstance, ExtendListener } from "@hyper-fetch/sockets";
import { create } from "zustand";

export type Connection = {
  name: string;
  // devtoolsSocket: SocketInstance;
  client: ClientInstance;
  environment: string;
  clientOptions: { url?: string };
  /** `client.adapter.options` of the user's client, as JSON. */
  adapterOptions: {
    name?: string;
    defaultMethod?: string;
    defaultExtra?: Record<string, unknown>;
    systemErrorStatus?: string | number;
    systemErrorExtra?: Record<string, unknown>;
    defaultRequestOptions?: Record<string, unknown>;
  };
  connected: boolean;
  eventListener: ExtendListener<ListenerInstance, { response: HFEventMessage["data"] }>;
  eventEmitter: ExtendEmitter<EmitterInstance, { payload: HFEventMessage["data"] | AppInternalMessage["data"] }>;
};

type ConnectionStore = {
  connections: { [key: string]: Connection };
  addConnection: (connection: Connection) => void;
  removeConnection: (connectionName: string) => void;
  updateConnection: (name: string, connection: Partial<Omit<Connection, "name">>) => void;
  /** Mark every application as disconnected, e.g. when HyperFlow loses its own server connection. */
  disconnectAll: () => void;
};

// Every update creates a new `connections` object, so selectors on it re-render.
export const useConnectionStore = create<ConnectionStore>((set) => ({
  connections: {},
  addConnection: (connection: Connection) => {
    set((state) => ({ connections: { ...state.connections, [connection.name]: connection } }));
  },
  removeConnection: (connectionName: string) => {
    set((state) => {
      const { [connectionName]: _removed, ...connections } = state.connections;
      return { connections };
    });
  },
  updateConnection: (name: string, connection: Partial<Omit<Connection, "name">>) => {
    set((state) => {
      if (!state.connections[name]) {
        return state;
      }
      return { connections: { ...state.connections, [name]: { ...state.connections[name], ...connection } } };
    });
  },
  disconnectAll: () => {
    set((state) => ({
      connections: Object.fromEntries(
        Object.entries(state.connections).map(([name, connection]) => [name, { ...connection, connected: false }]),
      ),
    }));
  },
}));
