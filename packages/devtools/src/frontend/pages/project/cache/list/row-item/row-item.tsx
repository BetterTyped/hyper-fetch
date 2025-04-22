import { useEffect, useState } from "react";
import { getLoadingByCacheKey } from "@hyper-fetch/core";
import { useShallow } from "zustand/react/shallow";

import { DevtoolsCacheEvent } from "frontend/context/projects/types";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useCountdown } from "frontend/hooks/use-countdown";
import { Key } from "frontend/components/ui/key";
import { TableCell, TableRow } from "frontend/components/ui/table";
import { Chip } from "frontend/components/ui/chip";
import { useCacheStore } from "frontend/store/project/cache.store";

export const CacheRowItem = ({ item }: { item: DevtoolsCacheEvent }) => {
  const { client, project } = useDevtools();
  const { detailsId, openDetails } = useCacheStore(
    useShallow((state) => ({
      detailsId: state.projects[project.name].detailsId,
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
      onClick={() => openDetails({ project: project.name, cacheKey: item.cacheKey })}
      className={`cursor-pointer hover:bg-light-100 dark:hover:bg-dark-500 rounded-md ${
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
