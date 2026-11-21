import { CacheDetails } from "./details/cache.details";
import { CacheList } from "./list/cache.list";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useCacheStore } from "@/store/applications/cache.store";

export const ApplicationCache = () => {
  const { application } = useDevtools();
  const item = useCacheStore((state) => {
    const { detailsId, caches } = state.applications[application.name];
    return detailsId ? caches.get(detailsId) : undefined;
  });

  return (
    <div className="flex relative flex-1 h-full">
      <CacheList />
      {item && <CacheDetails item={item} />}
    </div>
  );
};
