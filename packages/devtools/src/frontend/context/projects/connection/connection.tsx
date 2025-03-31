import { useState } from "react";
import { ClientInstance } from "@hyper-fetch/core";
import { EmitterInstance, ExtendEmitter, ExtendListener, ListenerInstance } from "@hyper-fetch/sockets";

import { BaseMessage } from "types/messages.types";
import { createContext } from "frontend/utils/context";

export type Connection = {
  name: string;
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

export const [ConnectionsContext, useConnections] = createContext<{
  connections: { [key: string]: Connection };
  setConnections: React.Dispatch<React.SetStateAction<{ [key: string]: Connection }>>;
}>("ConnectionContext", {
  connections: {},
  setConnections: () => {},
});

export const Connections = ({ children }: { children: React.ReactNode }) => {
  const [connections, setConnections] = useState<{ [key: string]: Connection }>({});

  return (
    <ConnectionsContext connections={connections} setConnections={setConnections}>
      {children}
    </ConnectionsContext>
  );
};
