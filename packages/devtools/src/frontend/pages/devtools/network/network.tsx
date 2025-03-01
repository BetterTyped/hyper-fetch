import { NetworkDetails } from "./details/network.details";
import { NetworkList } from "./list/network.list";
import { NetworkToolbar } from "./toolbar/network.toolbar";
import { Body } from "frontend/components/body/body";
import { Content } from "frontend/components/content/content";

export const Network = () => {
  return (
    <Body>
      {/* <NetworkToolbar /> */}
      <Content>
        <NetworkList />
        <NetworkDetails />
      </Content>
    </Body>
  );
};
