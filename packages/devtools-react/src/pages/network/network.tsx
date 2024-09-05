import { NetworkDetails } from "./details/network.details";
import { NetworkSidebar } from "./sidebar/network.sidebar";
import { NetworkToolbar } from "./toolbar/network.toolbar";
import { Body } from "components/body/body";
import { Content } from "components/content/content";

export const Network = () => {
  return (
    <Body>
      <NetworkToolbar />
      <Content>
        <NetworkSidebar />
        <NetworkDetails />
      </Content>
    </Body>
  );
};
