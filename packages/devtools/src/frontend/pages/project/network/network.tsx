import { ProjectLayout } from "../_layout/layout";
import { NetworkDetails } from "./details/network.details";
import { NetworkList } from "./list/network.list";
import { Content } from "frontend/components/content/content";

export const ProjectNetwork = () => {
  return (
    <ProjectLayout>
      {/* <NetworkToolbar /> */}
      <Content>
        <NetworkList />
        <NetworkDetails />
      </Content>
    </ProjectLayout>
  );
};
