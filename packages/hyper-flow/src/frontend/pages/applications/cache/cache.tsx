import { CacheList } from "./list/cache.list";
import { CacheDetails } from "./details/cache.details";

export const ApplicationCache = () => {
  return (
    <div className="flex relative flex-1 h-full">
      <CacheList />
      <CacheDetails />
    </div>
  );
};
