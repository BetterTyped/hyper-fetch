import { useEffect, useState } from "react";
import { getLoadingByCacheKey } from "@hyper-fetch/core";

import { DevtoolsCacheEvent } from "devtools.types";
import { useDevtoolsContext } from "devtools.context";
import { useCountdown } from "hooks/use-countdown";
import { Chip } from "components/chip/chip";

import { styles } from "pages/cache/cache.styles";

export const Item = ({ item }: { item: DevtoolsCacheEvent }) => {
  const { client, setDetailsCacheKey, detailsCacheKey } = useDevtoolsContext("DevtoolsNetworkRequest");
  const css = styles.useStyles();

  const cacheTimestamp = item.cacheData.responseTimestamp + item.cacheData.cacheTime;
  const countdown = useCountdown(cacheTimestamp);

  const [listeners, setListeners] = useState(
    client.requestManager.emitter.listeners(getLoadingByCacheKey(item.cacheKey))?.length,
  );

  useEffect(() => {
    return client.requestManager.emitter.onListenChange(getLoadingByCacheKey(item.cacheKey), (count) => {
      setListeners(count);
    });
  }, [client.requestManager.emitter, item.cacheKey, setDetailsCacheKey]);

  const isFresh = cacheTimestamp >= Date.now() ? Object.values(countdown).some((v) => v > 1) : false;

  return (
    <tr
      tabIndex={0}
      role="button"
      onClick={() => setDetailsCacheKey(item.cacheKey)}
      className={styles.clsx(css.row, { [css.activeRow]: item.cacheKey === detailsCacheKey })}
    >
      <td className={css.cell}>
        <span>{item.cacheKey}</span>
      </td>
      <td className={css.cell}>
        <Chip color={isFresh ? "green" : "orange"}>{isFresh ? "Fresh" : "Stale"}</Chip>
      </td>
      <td className={css.cell}>{listeners}</td>
      <td className={css.cell}>
        {!!item.cacheData?.responseTimestamp && (
          <div>{new Date(item.cacheData.responseTimestamp).toLocaleTimeString()} </div>
        )}
      </td>
    </tr>
  );
};
