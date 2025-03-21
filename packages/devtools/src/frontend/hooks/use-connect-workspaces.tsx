import { useState } from "react";
import { Client } from "@hyper-fetch/core";
import { useDidMount } from "@reins/hooks";
import { useImmer } from "use-immer";

import { Workspace } from "frontend/context/devtools.context";
import { initializeSocket } from "frontend/lib/socket/socket";
import { MessageType } from "types/messages.types";

export const useOnlineProjects = () => {
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [projects, setProjects] = useImmer<Record<string, Workspace>>({});

  useDidMount(() => {
    const initializeSocketState = async () => {
      const { devtoolsListener, clientSpecificReceiveMessage, clientSpecificSendMessage } = await initializeSocket();
      devtoolsListener.listen((event: any) => {
        const { connectionName, messageType } = event.data;

        switch (messageType) {
          case MessageType.DEVTOOLS_CLIENT_INIT:
            {
              const shouldCreateProject = !projects[connectionName];
              if (shouldCreateProject) {
                setProjects((draft) => {
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
                if (!activeProject) {
                  setActiveProject(connectionName);
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
    projects,
    setProjects,
  };
};
