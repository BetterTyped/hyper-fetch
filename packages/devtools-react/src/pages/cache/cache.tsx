import { CacheToolbar } from "./toolbar/cache.toolbar";
import { CacheSidebar } from "./sidebar/cache.sidebar";
import { CacheDetails } from "./details/cache.details";
import { Body } from "components/body/body";
import { Content } from "components/content/content";

export const Cache = () => {
  return (
    <Body>
      <CacheToolbar />
      <Content>
        <CacheSidebar />
        <CacheDetails />
      </Content>
    </Body>
  );
};
