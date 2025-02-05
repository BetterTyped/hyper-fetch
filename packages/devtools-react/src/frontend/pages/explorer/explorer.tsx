import { ExplorerToolbar } from "./toolbar/explorer.toolbar";
import { ExplorerSidebar } from "./list/explorer.sidebar";
import { ExplorerDetails } from "./details/explorer.details";
import { Body } from "frontend/components/body/body";
import { Content } from "frontend/components/content/content";

export const Explorer = () => {
  return (
    <Body>
      <ExplorerToolbar />
      <Content>
        <ExplorerSidebar />
        <ExplorerDetails />
      </Content>
    </Body>
  );
};
