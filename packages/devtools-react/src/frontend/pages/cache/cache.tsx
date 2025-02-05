import { CacheToolbar } from "./toolbar/cache.toolbar";
import { CacheList } from "./list/cache.list";
import { CacheDetails } from "./details/cache.details";
import { Body } from "frontend/components/body/body";
import { Content } from "frontend/components/content/content";

export const Cache = () => {
  return (
    <Body>
      <CacheToolbar />
      <Content>
        <CacheList />
        <CacheDetails />
      </Content>
    </Body>
  );
};
