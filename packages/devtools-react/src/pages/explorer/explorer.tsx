import { ExplorerToolbar } from "./toolbar/explorer.toolbar";
import { ExplorerSidebar } from "./sidebar/explorer.sidebar";
import { ExplorerDetails } from "./details/explorer.details";
import { Body } from "components/body/body";
import { Content } from "components/content/content";

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
