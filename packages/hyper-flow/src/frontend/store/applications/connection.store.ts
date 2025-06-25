import { ClientInstance } from "@hyper-fetch/core";
import { EmitterInstance, ExtendEmitter, ListenerInstance, ExtendListener } from "@hyper-fetch/sockets";
import { create } from "zustand";
import { AppInternalMessage, HFEventMessage } from "@hyper-fetch/plugin-devtools";

export type Connection = {
  name: string;
  // devtoolsSocket: SocketInstance;
  client: ClientInstance;
  environment: string;
  clientOptions: { url?: string };
  adapterOptions: {
    name?: string;
    defaultMethod?: string;
    // TODO - change to Record (transform with json.parse)
    defaultExtra?: string;
    // TODO - change to Record (transform with json.parse)
    systemErrorStatus?: string;
    // TODO - change to Record (transform with json.parse)
    systemErrorExtra?: string;
    // TODO - change to Record (transform with json.parse)
    defaultRequestOptions?: string;
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
};

export const useConnectionStore = create<ConnectionStore>((set) => ({
  connections: {},
  addConnection: (connection: Connection) => {
    set((state) => {
      const newState = { ...state };
      newState.connections[connection.name] = connection;
      return newState;
    });
  },
  removeConnection: (connectionName: string) => {
    set((state) => {
      const newState = { ...state };
      delete newState.connections[connectionName];
      return newState;
    });
  },
  updateConnection: (name: string, connection: Partial<Omit<Connection, "name">>) => {
    set((state) => {
      const newState = { ...state };
      newState.connections[name] = { ...newState.connections[name], ...connection };
      return newState;
    });
  },
}));
