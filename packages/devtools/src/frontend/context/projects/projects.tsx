import { useImmer } from "use-immer";

import { useSettings } from "frontend/store/settings.store";
import { Bridge } from "./bridge/bridge";
import { Connections, useConnections } from "./connection/connection";
import { Events } from "./events/events";
import { ProjectState, ProjectStatesContext } from "./state/state.context";
import { State } from "./state/state";

const Projects = () => {
  const { settings } = useSettings();
  const { connections } = useConnections("Projects");

  return (
    <>
      {settings.ports.map((port) => (
        <Bridge key={String(port)} port={port} />
      ))}
      {Object.keys(connections).map((connection) => (
        <Events key={connection} project={connection} />
      ))}
      {Object.keys(connections).map((project) => (
        <State key={project} project={project} />
      ))}
    </>
  );
};

export const ProjectsProvider = ({ children }: { children: React.ReactNode }) => {
  const [projectStates, setProjectStates] = useImmer<{ [key: string]: ProjectState }>({});
  return (
    <Connections>
      <ProjectStatesContext projectStates={projectStates} setProjectStates={setProjectStates}>
        <Projects />
        {children}
      </ProjectStatesContext>
    </Connections>
  );
};
