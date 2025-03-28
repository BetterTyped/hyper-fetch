import { useEffect, useState } from "react";
import { getLoadingByCacheKey } from "@hyper-fetch/core";

import * as Table from "frontend/components/table/table";
import { DevtoolsCacheEvent } from "frontend/context/projects/types";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useCountdown } from "frontend/hooks/use-countdown";
import { Chip } from "frontend/components/chip/chip";
import { Key } from "frontend/components/key/key";

export const Item = ({ item }: { item: DevtoolsCacheEvent }) => {
  const {
    client,
    setDetailsCacheKey,
    state: { detailsCacheKey },
  } = useDevtools();

  const staleTimestamp = item.cacheData.responseTimestamp + item.cacheData.staleTime;
  const countdown = useCountdown(staleTimestamp);

  const [listeners, setListeners] = useState(
    client.requestManager.emitter.listeners(getLoadingByCacheKey(item.cacheKey))?.length,
  );

  useEffect(() => {
    return client.requestManager.emitter.onListener(getLoadingByCacheKey(item.cacheKey), (count) => {
      setListeners(count);
    });
  }, [client.requestManager.emitter, item.cacheKey, setDetailsCacheKey]);

  const isFresh = staleTimestamp >= Date.now() ? Object.values(countdown).some((v) => v > 1) : false;

  return (
    <Table.Row
      tabIndex={0}
      role="button"
      onClick={() => setDetailsCacheKey(item.cacheKey)}
      className={`cursor-pointer hover:bg-light-100 dark:hover:bg-dark-500 ${
        item.cacheKey === detailsCacheKey ? "ring-1 ring-blue-400 ring-inset" : ""
      }`}
    >
      <Table.Cell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">
        <Key type="cache" value={item.cacheKey} />
      </Table.Cell>
      <Table.Cell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">
        <Chip color={isFresh ? "green" : "orange"}>{isFresh ? "Fresh" : "Stale"}</Chip>
      </Table.Cell>
      <Table.Cell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">{listeners}</Table.Cell>
      <Table.Cell className="font-light text-sm px-2 first:pl-[10px] last:pr-[10px]">
        {!!item.cacheData?.responseTimestamp && (
          <div className="text-light-700 dark:text-light-700">
            {new Date(item.cacheData.responseTimestamp).toLocaleTimeString()}
          </div>
        )}
      </Table.Cell>
    </Table.Row>
  );
};
