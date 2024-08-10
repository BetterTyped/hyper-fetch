import { DevtoolsCacheEvent } from "devtools.types";
import { useDevtoolsContext } from "devtools.context";

import { styles } from "pages/cache/cache.styles";

export const Item = ({ item }: { item: DevtoolsCacheEvent }) => {
  const { setDetailsCacheKey } = useDevtoolsContext("DevtoolsNetworkRequest");
  const css = styles.useStyles();

  return (
    <tr onClick={() => setDetailsCacheKey(item.cacheKey)} className={css.row}>
      <td className={css.cell}>
        <span>{item.cacheKey}</span>
      </td>
      <td className={css.cell}>
        {!!item.cacheData?.timestamp && <div>{new Date(item.cacheData.timestamp).toLocaleTimeString()} </div>}
      </td>
    </tr>
  );
};
