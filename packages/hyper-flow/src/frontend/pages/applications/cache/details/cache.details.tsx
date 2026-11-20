import { getLoadingByCacheKey } from "@hyper-fetch/core";
import { useEffect, useState } from "react";

import { SectionData } from "./section-data";
import { SectionHead } from "./section-head";
import { SectionOverview } from "./section-overview";
import { SectionToolbar } from "./section-toolbar";
import { ResizableSidebar } from "@/components/ui/resizable-sidebar";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import type { DevtoolsCacheEvent } from "@/context/applications/types";

export const CacheDetails = ({ item }: { item: DevtoolsCacheEvent }) => {
  const { client } = useDevtools();

  const [stale, setStale] = useState(item.cacheData.responseTimestamp + item.cacheData.staleTime < Date.now());

  const [listeners, setListeners] = useState(
    client.requestManager.emitter.listeners(getLoadingByCacheKey(item.cacheKey))?.length,
  );

  useEffect(() => {
    return client.requestManager.emitter.onListener(getLoadingByCacheKey(item.cacheKey), (count) => {
      setListeners(count);
    });
  }, [client.requestManager.emitter, item.cacheKey]);

  return (
    <ResizableSidebar
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
