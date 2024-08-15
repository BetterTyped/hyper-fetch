import { useMemo } from "react";

import { DevtoolsRequestEvent } from "devtools.types";
import { getStatus, getStatusColor, RequestStatusIcon } from "utils/request.status.utils";
import { useDevtoolsContext } from "devtools.context";

import { styles } from "pages/network/network.styles";

export const Request = ({ item }: { item: DevtoolsRequestEvent }) => {
  const { setDetailsRequestId } = useDevtoolsContext("DevtoolsNetworkRequest");
  const css = styles.useStyles();

  const status = useMemo(() => {
    return getStatus(item);
  }, [item]);

  const color = useMemo(() => {
    return getStatusColor(status);
  }, [status]);

  return (
    <tr onClick={() => setDetailsRequestId(item.requestId)} className={css.row}>
      <td className={css.cell} style={{ color }}>
        <div className={css.endpointCell}>
          <RequestStatusIcon status={status} />
          <span>{item.request.endpoint}</span>
        </div>
      </td>
      <td className={css.cell} style={{ color }}>
        {status}
      </td>
      <td className={css.cell} style={{ color }}>
        {String(item.request.method)}
      </td>
      <td className={css.cell} style={{ color }}>
        {String(item.response?.status || "")}
      </td>
      <td className={css.cell} style={{ color }}>
        {new Date(item.triggerTimestamp).toLocaleTimeString()}{" "}
      </td>
      <td className={css.cell} style={{ color }}>
        {!!item.details?.responseTimestamp && (
          <div>
            {new Date(item.details.responseTimestamp).toLocaleTimeString()}{" "}
            <span className={css.timestamp}>({item.details.responseTimestamp - item.triggerTimestamp}ms)</span>
          </div>
        )}
      </td>
    </tr>
  );
};
