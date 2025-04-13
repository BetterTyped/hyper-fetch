import { useEffect, useMemo, useState } from "react";
import { TrashIcon, FileXIcon, TriangleAlert, LoaderIcon } from "lucide-react";
import { AdapterInstance, CacheValueType, getLoadingByCacheKey } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "frontend/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow } from "frontend/components/ui/table";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Separator } from "frontend/components/ui/separator";
import { Button } from "frontend/components/ui/button";
import { Bar } from "frontend/components/bar/bar";
import { JSONViewer } from "frontend/components/json-viewer/json-viewer";
import { Countdown } from "frontend/components/countdown/countdown";
import { Chip } from "frontend/components/ui/chip";
import { Key } from "frontend/components/ui/key";
import { ResizableSidebar } from "frontend/components/ui/resizable-sidebar";
import { Back } from "./back/back";
import { useCacheStore } from "frontend/store/project/cache.store";
import { useNetworkStore } from "frontend/store/project/network.store";

export const CacheDetails = () => {
  const { client, project } = useDevtools();

  const { detailsId, caches, loadingKeys, addLoadingKeys, removeLoadingKeys } = useCacheStore(
    useShallow((state) => ({
      detailsId: state.projects[project.name].detailsId,
      caches: state.projects[project.name].caches,
      loadingKeys: state.projects[project.name].loadingKeys,
      addLoadingKeys: state.addLoadingKey,
      removeLoadingKeys: state.removeLoadingKey,
    })),
  );

  const { requests } = useNetworkStore((state) => state.projects[project.name]);

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

  const hasInProgressRequest = item ? requests.some((i) => i.request.cacheKey === item.cacheKey) : false;
  const isLoading = item ? loadingKeys.has(item.cacheKey) : false;

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

  const latestItem = useMemo(() => {
    if (!item) return null;

    const element = requests.find((el) => el.request.cacheKey === item.cacheKey);
    if (!element)
      return {
        request: {
          cacheKey: item.cacheKey,
        } as any,
        requestId: "",
      };
    return element;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.cacheKey, requests?.length]);

  const onChangeData = (newData: CacheValueType<any, any, any>) => {
    if (item) {
      const data = { ...item.cacheData, ...newData, version: client.cache.version };

      client.cache.storage.set<any, any, any>(item.cacheKey, data);
      client.cache.lazyStorage?.set<any, any, any>(item.cacheKey, data);
      client.cache.events.emitCacheData<any, any, any>(data);
    }
  };

  const invalidate = () => {
    if (!item) return;
    client.cache.invalidate(item.cacheKey);
  };

  const remove = () => {
    if (!item) return;
    client.cache.delete(item.cacheKey);
  };

  const toggleLoading = () => {
    if (!item || !latestItem) return;
    if (!hasInProgressRequest) {
      addLoadingKeys({ project: project.name, cacheKey: item.cacheKey });
    } else {
      removeLoadingKeys({ project: project.name, cacheKey: item.cacheKey });
    }
  };

  const error = () => {
    if (!item) return;
    const data: CacheValueType<unknown, unknown, any> = {
      ...item.cacheData,
      data: null,
      error: project.settings.simulatedErrors.Default,
      responseTimestamp: Date.now(),
      extra: client.adapter.defaultExtra,
      success: false,
    };
    client.cache.storage.set(item.cacheKey, data);
    client.cache.events.emitCacheData(data);
  };

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
      minWidth="400px"
      maxWidth="100%"
      minHeight="100%"
      maxHeight="100%"
    >
      <Bar className="flex-nowrap">
        <Back />
        <Separator className="h-[18px] mx-0 mr-1" />
        <Key value={item.cacheKey} type="cache" />
        <Chip color={stale ? "orange" : "green"}>{stale ? "Stale" : "Fresh"}</Chip>
        {item.cacheData.hydrated && <Chip color="green">Hydrated</Chip>}
        <div className="flex-1" />
      </Bar>
      <div className="overflow-y-auto pb-10">
        <div className="p-2.5">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Cache Observers:</TableCell>
                <TableCell>{listeners}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Last updated:</TableCell>
                <TableCell>
                  {`${new Date(item.cacheData.responseTimestamp).toLocaleDateString()}, ${new Date(
                    item.cacheData.responseTimestamp,
                  ).toLocaleTimeString()}`}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Time left before stale:</TableCell>
                <TableCell>
                  <Countdown
                    value={item.cacheData.responseTimestamp + item.cacheData.staleTime}
                    onDone={() => setStale(true)}
                    onStart={() => setStale(false)}
                    doneText={<Chip color="gray">Cache data is stale</Chip>}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Time left for garbage collection:</TableCell>
                <TableCell>
                  <Countdown
                    value={item.cacheData.responseTimestamp + item.cacheData.cacheTime}
                    doneText={<Chip color="gray">Data removed from cache</Chip>}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 mt-1.5">
            <Button color={isLoading ? "teal" : "blue"} onClick={toggleLoading} disabled={hasInProgressRequest}>
              <LoaderIcon />
              {isLoading ? "Restore" : "Set"} loading
            </Button>
            <Button color="red" onClick={error}>
              <TriangleAlert />
              Simulate Error
            </Button>
            <Button color="pink" onClick={invalidate}>
              <FileXIcon />
              Invalidate
            </Button>
            <Button color="gray" onClick={remove}>
              <TrashIcon />
              Remove
            </Button>
          </div>
        </div>
        <Accordion type="single" collapsible>
          <AccordionItem value="config">
            <AccordionTrigger className="px-2.5">Config</AccordionTrigger>
            <AccordionContent>
              <div className="p-2.5">
                <JSONViewer data={elements?.additionalData} onChange={onChangeData} sortObjectKeys />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cache">
            <AccordionTrigger className="px-2.5">Cache</AccordionTrigger>
            <AccordionContent>
              <div className="p-2.5">
                <JSONViewer data={elements?.data} onChange={onChangeData} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ResizableSidebar>
  );
};
