import { useMemo } from "react";

import * as Table from "components/table/table";
import { DevtoolsRequestEvent } from "devtools.types";
import { getStatus, getStatusColor, RequestStatusIcon } from "utils/request.status.utils";
import { useDevtoolsContext } from "devtools.context";

import { styles } from "../../network.styles";

export const Request = ({ item }: { item: DevtoolsRequestEvent }) => {
  const { setDetailsRequestId, theme, detailsRequestId } = useDevtoolsContext("DevtoolsNetworkRequest");
  const css = styles.useStyles();

  const status = useMemo(() => {
    return getStatus(item);
  }, [item]);

  const color = useMemo(() => {
    return getStatusColor(status, theme === "light");
  }, [status, theme]);

  return (
    <Table.Row
      tabIndex={0}
      role="button"
      onClick={() => setDetailsRequestId(item.requestId)}
      className={css.clsx(css.row, { [css.activeRow]: item.requestId === detailsRequestId })}
    >
      <Table.Cell className={css.cell} style={{ color }}>
        <div className={css.endpointCell}>
          <RequestStatusIcon status={status} />
          <span>{item.request.endpoint}</span>
        </div>
      </Table.Cell>

      <Table.Cell className={css.cell} style={{ color }}>
        {String(item.request.method)}
      </Table.Cell>
      <Table.Cell className={css.cell} style={{ color, textTransform: "capitalize" }}>
        {String(item.response?.success ?? "")}
      </Table.Cell>
      <Table.Cell className={css.cell} style={{ color }}>
        <div>
          {new Date(item.triggerTimestamp).toLocaleTimeString()}{" "}
          {!!item.details?.responseTimestamp && (
            <span className={css.timestamp}>({item.details.responseTimestamp - item.triggerTimestamp}ms)</span>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  );
};
