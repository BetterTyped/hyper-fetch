import { useMemo, useState } from "react";
import { ChevronDown, Boxes, FileSliders } from "lucide-react";
import { AdapterInstance, CacheValueType } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JSONViewer } from "@/components/json-viewer/json-viewer";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/no-content/empty-state";
import { DevtoolsCacheEvent } from "@/context/applications/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useCacheStore } from "@/store/applications/cache.store";

export const SectionData = ({ item }: { item: DevtoolsCacheEvent }) => {
  const { client, application } = useDevtools();
  const { setCacheItem } = useCacheStore(
    useShallow((selector) => ({
      setCacheItem: selector.setCacheItem,
    })),
  );

  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("cache");

  const onChangeData = (newData: CacheValueType<any, any, any>) => {
    if (item) {
      const data = { ...item.cacheData, ...newData, version: client.cache.version, cached: true };

      setCacheItem({
        application: application.name,
        cacheKey: item.cacheKey,
        cacheData: data,
      });
      client.cache.events.emitCacheData<any, any, any>(data, true);
    }
  };

  const elements = useMemo(() => {
    if (!item) return null;

    const {
      data,
      error,
      extra,
      responseTimestamp,
      requestTimestamp,
      success,
      status,
      retries,
      isCanceled,
      isOffline,
      ...additionalData
    } = item.cacheData;

    return {
      data: {
        data,
        error,
        extra,
        status,
        responseTimestamp,
        requestTimestamp,
        success,
        retries,
        isCanceled,
        isOffline,
      },
      additionalData,
    } satisfies {
      data: Partial<CacheValueType<any, any, AdapterInstance>>;
      additionalData: Partial<CacheValueType<any, any, AdapterInstance>>;
    };
  }, [item]);

  const hasContent = (value: string) => {
    switch (value) {
      case "cache":
        return !!elements?.data;
      case "config":
        return !!elements?.additionalData;
      default:
        return false;
    }
  };

  return (
    <Tabs defaultValue="cache" className="h-[600px] my-4 flex-1" onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="cache">
          <Boxes />
          Cache
        </TabsTrigger>
        <TabsTrigger value="config">
          <FileSliders />
          Details
        </TabsTrigger>
      </TabsList>

      <div className="relative">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            !isOpen && hasContent(activeTab) && "max-h-[200px]",
          )}
        >
          <TabsContent value="cache" className="h-full">
            {elements?.data ? (
              <Card className="p-4 bg-sidebar mb-4">
                <JSONViewer data={elements?.data} onChange={onChangeData} />
              </Card>
            ) : (
              <EmptyState title="No cache data" description="There is no cache data available" />
            )}
          </TabsContent>

          <TabsContent value="config" className="h-full">
            {elements?.additionalData ? (
              <Card className="p-4 bg-sidebar mb-4 h-full overflow-auto">
                <JSONViewer data={elements?.additionalData} onChange={onChangeData} />
              </Card>
            ) : (
              <EmptyState title="No config found" description="There is no config data available" />
            )}
          </TabsContent>
        </div>

        {hasContent(activeTab) && (
          <>
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-24 pointer-events-none",
                !isOpen && "bg-gradient-to-t from-card to-transparent",
                !isOpen && "h-32",
              )}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "absolute left-1/2 -translate-x-1/2 flex items-center gap-1 z-10",
                isOpen ? "bottom-1" : "bottom-4",
              )}
            >
              {isOpen ? "Show Less" : "Show More"}
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
            </Button>
          </>
        )}
      </div>
    </Tabs>
  );
};
