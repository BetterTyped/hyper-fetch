import { useState } from "react";
import { Client } from "@hyper-fetch/core";
import { useImmer } from "use-immer";

import { initializeSocket } from "./sockets/socket";
import { DevtoolsSocketWrapper } from "./sockets/devtools.socket.wrapper";
import { MessageType } from "./types/messages.types";
import "./App.css";
import { useDidMount } from "@reins/hooks";
import { DevtoolsWorkspaces, Workspace } from "./frontend/devtools.context";

export function App() {
  const [defaultWorkspace, setDefaultWorkspace] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<string>("Default");
  const [] = useState();
  const [workspaces, setWorkspaces] = useImmer<Record<string, Workspace>>({});
  const setRequestList = (workspaceName: string, requestList: any) => {
    setWorkspaces((draft) => {
      const selectedWorkspace = draft[workspaceName];
      if (selectedWorkspace) {
        selectedWorkspace.requests = requestList;
      }
    });
  };
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
                if (!defaultWorkspace) {
                  setDefaultWorkspace(connectionName);
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

  return (
    <>
      {Object.keys(workspaces).length === 0 ? (
        <div>
          <p>ADD LOADER</p>
        </div>
      ) : (
        <DevtoolsWorkspaces
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          setActiveWorkspace={setActiveWorkspace}
          setRequestList={setRequestList}
        >
          {Object.values(workspaces).map((workspace) => (
            <DevtoolsSocketWrapper key={workspace.id} workspace={workspace.name} client={workspace.client} />
          ))}
        </DevtoolsWorkspaces>
      )}
    </>
  );
}
