import { CacheList } from "./list/cache.list";
import { CacheDetails } from "./details/cache.details";
import { Content } from "frontend/components/content/content";
import { ProjectLayout } from "../_layout/layout";

export const Cache = () => {
  return (
    <ProjectLayout>
      <Content>
        <CacheList />
        <CacheDetails />
      </Content>
    </ProjectLayout>
  );
};
