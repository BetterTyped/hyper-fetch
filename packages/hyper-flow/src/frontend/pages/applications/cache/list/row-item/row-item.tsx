import { memo } from "react";

import { Chip } from "@/components/ui/chip";
import { Key } from "@/components/ui/key";
import { TableCell, TableRow } from "@/components/ui/table";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import type { DevtoolsCacheEvent } from "@/context/applications/types";
import { useCountdown } from "@/hooks/use-countdown";
import { useCacheStore } from "@/store/applications/cache.store";

/** One cache entry. Memoized and subscribed only to its own selection. */
export const CacheRowItem = memo(({ item }: { item: DevtoolsCacheEvent }) => {
  const { application } = useDevtools();
  const openDetails = useCacheStore((state) => state.openDetails);
  const isSelected = useCacheStore((state) => state.applications[application.name]?.detailsId === item.cacheKey);
  const observers = useCacheStore((state) => state.applications[application.name]?.observers.get(item.cacheKey) ?? 0);

  const staleTimestamp = item.cacheData.responseTimestamp + item.cacheData.staleTime;
  const countdown = useCountdown(staleTimestamp);

  const isFresh = staleTimestamp >= Date.now() ? Object.values(countdown).some((v) => v > 1) : false;

  return (
    <TableRow
      tabIndex={0}
      role="button"
      onClick={() => openDetails({ application: application.name, cacheKey: item.cacheKey })}
      className={`cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md ${
        isSelected ? "ring-1 ring-blue-400 ring-inset" : ""
      }`}
    >
      <TableCell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">
        <Key type="cache" value={item.cacheKey} />
      </TableCell>
      <TableCell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">
        <Chip color={isFresh ? "green" : "orange"}>{isFresh ? "Fresh" : "Stale"}</Chip>
      </TableCell>
      <TableCell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">{observers}</TableCell>
      <TableCell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">
        {!!item.cacheData?.responseTimestamp && (
          <div className="text-light-700 dark:text-light-700">
            {new Date(item.cacheData.responseTimestamp).toLocaleTimeString()}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
});
