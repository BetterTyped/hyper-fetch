/* eslint-disable react/no-array-index-key */
import { useMemo } from "react";

import { useDevtoolsContext } from "devtools.context";
import { Request } from "./request/request";
import { Table } from "components/table/table";
import { NoContent } from "components/no-content/no-content";
import { Status } from "utils/request.status.utils";

import { styles } from "../network.styles";

export const Content = () => {
  const { requests, networkFilter } = useDevtoolsContext("DevtoolsNetworkContent");
  const css = styles.useStyles();

  const items = useMemo(() => {
    if (!networkFilter) return requests;
    switch (networkFilter) {
      case Status.SUCCESS:
        return requests.filter((item) => item.isSuccess);
      case Status.FAILED:
        return requests.filter((item) => item.isFinished && !item.isCanceled && !item.isSuccess);
      case Status.IN_PROGRESS:
        return requests.filter((item) => !item.isFinished);
      case Status.PAUSED:
        return requests.filter((item) => item.isPaused);
      case Status.CANCELED:
        return requests.filter((item) => item.isCanceled);
      default:
        return requests;
    }
  }, [requests, networkFilter]);

  return (
    <>
      <Table>
        <thead style={{ opacity: !requests.length ? 0.4 : 1 }}>
          <tr>
            <th className={css.label}>Endpoint</th>
            <th className={css.label}>Status</th>
            <th className={css.label}>Method</th>
            <th className={css.label}>Status</th>
            <th className={css.label}>Added Time</th>
            <th className={css.label}>Response Time</th>
          </tr>
        </thead>
        <tbody className={css.tbody}>
          {items.map((item, index) => {
            return <Request key={index} item={item} />;
          })}
        </tbody>
      </Table>
      {!items.length && <NoContent style={{ marginTop: "40px" }} text="Make some request to see them here!" />}
    </>
  );
};
