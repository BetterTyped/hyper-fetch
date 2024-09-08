import { DevtoolsWorkspaces, Workspace } from "@hyper-fetch/devtools-react";
import "./App.css";
import { DevtoolsSocketWrapper } from "./sockets/devtools.socket.wrapper";
import { useEffect, useState } from "react";
import { useListener } from "@hyper-fetch/react";
import { Client } from "@hyper-fetch/core";
import { ConnectionName } from "./sockets/connection.name";
import { MessageType } from "../types/messages.types";
import { initSocket, receiveMessage } from "./sockets/socket";
import { useImmer } from "use-immer";

function App() {
  const [defaultWorkspace, setDefaultWorkspace] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<string>("Default");
  const [workspaces, setWorkspaces] = useImmer<Record<string, Workspace>>({});
  const setRequestList = (workspaceName: string, requestList: any) => {
    setWorkspaces((draft) => {
      const selectedWorkspace = draft[workspaceName];
      if (selectedWorkspace) {
        selectedWorkspace.requests = requestList;
      }
    });
  };
  const { onEvent } = useListener(receiveMessage, {});
  onEvent((event) => {
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
        console.error("Unknown message type");
    }
  });

  useEffect(() => {
    initSocket.setQuery({ connectionName: ConnectionName.HF_DEVTOOLS_APP });
    initSocket.connect();
  }, []);

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

export default App;
