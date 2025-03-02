import { ExplorerSidebar } from "./list/explorer.sidebar";
import { ExplorerDetails } from "./details/explorer.details";
import { Content } from "frontend/components/content/content";
import { ProjectLayout } from "../_layout/layout";

export const Explorer = () => {
  return (
    <ProjectLayout>
      <Content>
        <ExplorerSidebar />
        <ExplorerDetails />
      </Content>
    </ProjectLayout>
  );
};
