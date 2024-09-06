import { DevtoolsWorkspaces, Workspace } from "@hyper-fetch/devtools-react";
import "./App.css";
import { DevtoolsSocketWrapper } from "./sockets/devtools.socket.wrapper";
import { useEffect, useState } from "react";
import { useListener } from "@hyper-fetch/react";
import { Client } from "@hyper-fetch/core";
import { ConnectionName } from "./sockets/connection.name";
import { MessageType } from "../types/messages.types";
import { initSocket, receiveMessage } from "./sockets/socket";

function App() {
  const [defaultWorkspace, setDefaultWorkspace] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<string>("Default");
  const [workspaces, setWorkspaces] = useState<Record<string, Workspace>>({});
  const setRequestList = (workspaceName: string, requestList: any) => {
    // TODO fix. Immer? Or different way.
    setWorkspaces((prevState) => {
      const newState = { ...prevState };
      const selectedWorkspace = (newState[workspaceName] = { ...newState[workspaceName] });
      if (selectedWorkspace) {
        selectedWorkspace.requests = requestList;
      }
      return newState;
    });
  };
  const { onEvent } = useListener(receiveMessage, {});
  onEvent((event) => {
    const { connectionName, messageType } = event.data;
    switch (messageType) {
      case MessageType.DEVTOOLS_CLIENT_INIT:
        {
          const shouldCreateWorkspace = !workspaces[connectionName];
          if (!shouldCreateWorkspace) {
            // TODO handle
            console.error("Something went wrong");
          }
          setWorkspaces((prevState) => {
            return {
              ...prevState,
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
