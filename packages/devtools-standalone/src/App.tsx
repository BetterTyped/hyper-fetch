import { DevtoolsWorkspaces } from "@hyper-fetch/devtools-react";
import "./App.css";
import { DevtoolsSocketWrapper } from "./sockets/devtools.socket.wrapper";
import { useState } from "react";

function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<string>("Default");
  return (
    <DevtoolsWorkspaces
      workspaces={[{ id: "1", name: "Default" }]}
      activeWorkspace={activeWorkspace}
      setActiveWorkspace={setActiveWorkspace}
    >
      {/* TODO render it with clients.map() and add workspace id so it can be selected */}
      <DevtoolsSocketWrapper key="1" workspace="1" />
    </DevtoolsWorkspaces>
  );
}

export default App;
