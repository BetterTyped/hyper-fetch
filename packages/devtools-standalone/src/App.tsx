import { DevtoolsWorkspaces } from "@hyper-fetch/devtools-react";
import "./App.css";
import { DevtoolsSocketWrapper } from "./sockets/devtools.socket.wrapper";
import { useState } from "react";

function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<string>("Default");
  // const [workspaces, setWorkspaces] = useState([{ id: "1", name: "Default", requests: [] }]);
  // const setRequestList = (workspaceId, requestList: any) => {};
  return (
    <DevtoolsWorkspaces
      workspaces={[{ id: "1", name: "Default", requests: [] }]}
      activeWorkspace={activeWorkspace}
      setActiveWorkspace={setActiveWorkspace}
      setRequestList={() => {}}
    >
      {/* TODO render it with clients.map() and add workspace id so it can be selected */}
      <DevtoolsSocketWrapper key="1" workspace="1" />
    </DevtoolsWorkspaces>
  );
}

export default App;
