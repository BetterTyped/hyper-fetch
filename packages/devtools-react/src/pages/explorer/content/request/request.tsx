import { RequestInstance } from "@hyper-fetch/core";

import { Chip } from "../../../../components/chip/chip";
import { useDevtoolsContext } from "devtools.context";

import { styles } from "../../explorer.styles";

export const Request = ({ item }: { item: RequestInstance }) => {
  const { setDetailsExplorerRequest } = useDevtoolsContext("DevtoolsExplorerRequest");
  const css = styles.useStyles();

  return (
    <tr tabIndex={0} role="button" className={styles.clsx(css.row)} onClick={() => setDetailsExplorerRequest(item)}>
      <td className={css.cell}>{String(item.endpoint)}</td>
      <td className={css.cell}>
        <Chip color="blue">{String(item.method)}</Chip>
      </td>
      <td className={css.cell}>{String(item.cacheKey)}</td>
      <td className={css.cell}>0</td>
    </tr>
  );
};
