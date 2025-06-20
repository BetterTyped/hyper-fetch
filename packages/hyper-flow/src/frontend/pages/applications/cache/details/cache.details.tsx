import { useEffect, useMemo, useState } from "react";
import { getLoadingByCacheKey } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { ResizableSidebar } from "@/components/ui/resizable-sidebar";
import { useCacheStore } from "@/store/applications/cache.store";
import { SectionToolbar } from "./section-toolbar";
import { SectionHead } from "./section-head";
import { SectionOverview } from "./section-overview";
import { SectionData } from "./section-data";

export const CacheDetails = () => {
  const { client, application } = useDevtools();

  const { detailsId, caches } = useCacheStore(
    useShallow((state) => ({
      detailsId: state.applications[application.name].detailsId,
      caches: state.applications[application.name].caches,
      addLoadingKeys: state.addLoadingKey,
      removeLoadingKeys: state.removeLoadingKey,
    })),
  );

  const item = useMemo(() => {
    if (!detailsId) return null;
    return caches.get(detailsId);
  }, [detailsId, caches]);

  const [listeners, setListeners] = useState(
    item ? client.requestManager.emitter.listeners(getLoadingByCacheKey(item.cacheKey))?.length : 0,
  );

  const [stale, setStale] = useState(
    item ? item.cacheData.responseTimestamp + item.cacheData.staleTime < Date.now() : false,
  );

  useEffect(() => {
    return item
      ? client.requestManager.emitter.onListener(getLoadingByCacheKey(item?.cacheKey), (count) => {
          setListeners(count);
        })
      : undefined;
  }, [client.requestManager.emitter, item, item?.cacheKey]);

  // TODO NO CONTENT
  if (!item) return null;

  return (
    <ResizableSidebar
      position="right"
      className="absolute flex flex-col inset-y-0 right-0"
      defaultSize={{
        width: "70%",
      }}
      minWidth="500px"
      maxWidth="100%"
      minHeight="100%"
      maxHeight="100%"
    >
      <div className="max-h-full flex flex-col">
        <div className="px-4">
          <SectionToolbar item={item} />
          <SectionHead item={item} stale={stale} />
        </div>
        <div className="px-4 overflow-auto">
          <SectionOverview item={item} listeners={listeners} setStale={setStale} />
          <SectionData item={item} />
        </div>
      </div>
    </ResizableSidebar>
  );
};
