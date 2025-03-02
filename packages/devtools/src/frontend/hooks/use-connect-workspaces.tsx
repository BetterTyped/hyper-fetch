import { useState } from "react";
import { Client } from "@hyper-fetch/core";
import { useDidMount } from "@reins/hooks";
import { useImmer } from "use-immer";

import { Workspace } from "frontend/context/devtools.context";
import { initializeSocket } from "frontend/lib/socket/socket";
import { MessageType } from "types/messages.types";

export const useConnectWorkspaces = () => {
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useImmer<Record<string, Workspace>>({});

  useDidMount(() => {
    const initializeSocketState = async () => {
      const { devtoolsListener, clientSpecificReceiveMessage, clientSpecificSendMessage } = await initializeSocket();
      devtoolsListener.listen((event: any) => {
        const { connectionName, messageType } = event.data;

        switch (messageType) {
          case MessageType.DEVTOOLS_CLIENT_INIT:
            {
              const shouldCreateWorkspace = !workspaces[connectionName];
              if (shouldCreateWorkspace) {
                setWorkspaces((draft) => {
                  return {
                    ...draft,
                    [connectionName]: {
                      id: connectionName,
                      name: connectionName,
                      client: new Client({ url: "http://localhost.dummyhost:5000" }),
                      clientSpecificReceiveMessage,
                      clientSpecificSendMessage,
                    },
                  };
                });
                if (!activeWorkspace) {
                  setActiveWorkspace(connectionName);
                }
              }
            }
            return;
          default:
            console.error(`Unknown message type: ${messageType}`);
        }
      });
    };

    initializeSocketState();
  });

  return {
    workspaces,
    setWorkspaces,
    activeWorkspace,
    setActiveWorkspace,
  };
};
