import { RequestInstance } from "@hyper-fetch/core";

import { DevtoolsRequestEvent } from "devtools.types";
import { useDevtoolsContext } from "devtools.context";
import { Chip } from "../../../components/chip/chip";

import { styles } from "pages/network/network.styles";

export const Request = ({ item }: { item: RequestInstance }) => {
  const { client, theme } = useDevtoolsContext("DevtoolsNetworkRequest");
  const css = styles.useStyles();

  console.log("PRINT ITEM", item);
  return (
    <tr tabIndex={0} role="button" className={styles.clsx(css.row)}>
      <td className={css.cell}>
        <div className={css.endpointCell}>
          <span>
            <Chip color="blue">{String(item.method)}</Chip>
          </span>
        </div>
      </td>
      <td className={css.cell}>{String(item.endpoint)}</td>
      <td className={css.cell}>{String(item.cacheKey)}</td>
      <td className={css.cell}>0</td>
    </tr>
  );
};
