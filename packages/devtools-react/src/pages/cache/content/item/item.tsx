import { useEffect, useState } from "react";
import { getLoadingByCacheKey } from "@hyper-fetch/core";

import { DevtoolsCacheEvent } from "devtools.types";
import { useDevtoolsContext } from "devtools.context";

import { styles } from "pages/cache/cache.styles";

export const Item = ({ item }: { item: DevtoolsCacheEvent }) => {
  const { client, setDetailsCacheKey } = useDevtoolsContext("DevtoolsNetworkRequest");
  const css = styles.useStyles();

  const [listeners, setListeners] = useState(
    client.requestManager.emitter.listeners(getLoadingByCacheKey(item.cacheKey))?.length,
  );

  useEffect(() => {
    return client.requestManager.emitter.onListenChange(getLoadingByCacheKey(item.cacheKey), (count) => {
      setListeners(count);
    });
  }, [client.requestManager.emitter, item.cacheKey, setDetailsCacheKey]);

  return (
    <tr onClick={() => setDetailsCacheKey(item.cacheKey)} className={css.row}>
      <td className={css.cell}>
        <span>{item.cacheKey}</span>
      </td>
      <td>{listeners}</td>
      <td className={css.cell}>
        {!!item.cacheData?.responseTimestamp && (
          <div>{new Date(item.cacheData.responseTimestamp).toLocaleTimeString()} </div>
        )}
      </td>
    </tr>
  );
};
