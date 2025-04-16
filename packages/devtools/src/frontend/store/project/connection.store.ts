import { ClientInstance } from "@hyper-fetch/core";
import { EmitterInstance, ExtendEmitter, ListenerInstance, ExtendListener } from "@hyper-fetch/sockets";
import { create } from "zustand";
import { produce } from "immer";

import { BaseMessage } from "types/messages.types";

export type Connection = {
  name: string;
  // devtoolsSocket: SocketInstance;
  client: ClientInstance;
  metaData: {
    clientOptions: { url?: string };
    // TODO - not sure if any is the best approach
    adapterOptions: {
      name?: string;
      defaultMethod?: any;
      defaultExtra?: any;
      systemErrorStatus?: any;
      systemErrorExtra?: any;
      defaultRequestOptions?: any;
    };
  };
  connected: boolean;
  eventListener: ExtendListener<ListenerInstance, { response: BaseMessage["data"] }>;
  eventEmitter: ExtendEmitter<EmitterInstance, { payload: BaseMessage["data"] }>;
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
    set((state) =>
      produce(state, (draft) => {
        draft.connections[connection.name] = connection;
      }),
    );
  },
  removeConnection: (connectionName: string) => {
    set((state) =>
      produce(state, (draft) => {
        delete draft.connections[connectionName];
      }),
    );
  },
  updateConnection: (name: string, connection: Partial<Omit<Connection, "name">>) => {
    set((state) =>
      produce(state, (draft) => {
        draft.connections[name] = { ...draft.connections[name], ...connection };
      }),
    );
  },
}));
