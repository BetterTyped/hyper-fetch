import { RequestInstance } from "@hyper-fetch/core";

import { Chip } from "../../../components/chip/chip";

import { styles } from "pages/network/network.styles"; // TODO: Change this to the correct path

export const Request = ({ item }: { item: RequestInstance }) => {
  const css = styles.useStyles();

  return (
    <tr tabIndex={0} role="button" className={styles.clsx(css.row)}>
      <td className={css.cell}>{String(item.endpoint)}</td>
      <td className={css.cell}>
        <div className={css.endpointCell}>
          <span>
            <Chip color="blue">{String(item.method)}</Chip>
          </span>
        </div>
      </td>
      <td className={css.cell}>{String(item.cacheKey)}</td>
      <td className={css.cell}>0</td>
    </tr>
  );
};
