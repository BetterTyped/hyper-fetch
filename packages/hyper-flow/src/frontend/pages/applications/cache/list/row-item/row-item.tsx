import { useEffect, useState } from "react";
import { getLoadingByCacheKey } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { DevtoolsCacheEvent } from "@/context/applications/types";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useCountdown } from "@/hooks/use-countdown";
import { Key } from "@/components/ui/key";
import { TableCell, TableRow } from "@/components/ui/table";
import { Chip } from "@/components/ui/chip";
import { useCacheStore } from "@/store/applications/cache.store";

export const CacheRowItem = ({ item }: { item: DevtoolsCacheEvent }) => {
  const { client, application } = useDevtools();
  const { detailsId, openDetails } = useCacheStore(
    useShallow((state) => ({
      detailsId: state.applications[application.name].detailsId,
      openDetails: state.openDetails,
    })),
  );

  const staleTimestamp = item.cacheData.responseTimestamp + item.cacheData.staleTime;
  const countdown = useCountdown(staleTimestamp);

  const [listeners, setListeners] = useState(
    client.requestManager.emitter.listeners(getLoadingByCacheKey(item.cacheKey))?.length,
  );

  useEffect(() => {
    return client.requestManager.emitter.onListener(getLoadingByCacheKey(item.cacheKey), (count) => {
      setListeners(count);
    });
  }, [client.requestManager.emitter, item.cacheKey]);

  const isFresh = staleTimestamp >= Date.now() ? Object.values(countdown).some((v) => v > 1) : false;

  return (
    <TableRow
      tabIndex={0}
      role="button"
      onClick={() => openDetails({ application: application.name, cacheKey: item.cacheKey })}
      className={`cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md ${
        item.cacheKey === detailsId ? "ring-1 ring-blue-400 ring-inset" : ""
      }`}
    >
      <TableCell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">
        <Key type="cache" value={item.cacheKey} />
      </TableCell>
      <TableCell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">
        <Chip color={isFresh ? "green" : "orange"}>{isFresh ? "Fresh" : "Stale"}</Chip>
      </TableCell>
      <TableCell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">{listeners}</TableCell>
      <TableCell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">
        {!!item.cacheData?.responseTimestamp && (
          <div className="text-light-700 dark:text-light-700">
            {new Date(item.cacheData.responseTimestamp).toLocaleTimeString()}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};
