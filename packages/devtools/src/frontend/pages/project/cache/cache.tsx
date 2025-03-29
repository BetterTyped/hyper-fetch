import { CacheList } from "./list/cache.list";
import { CacheDetails } from "./details/cache.details";
import { Content } from "frontend/components/content/content";

export const ProjectCache = () => {
  return (
    <div className="flex relative flex-1 h-full">
      <CacheList />
      <CacheDetails />
    </div>
  );
};
