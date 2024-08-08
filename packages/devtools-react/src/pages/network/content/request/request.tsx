import { useMemo } from "react";

import { DevtoolsRequestEvent } from "devtools.types";
import { getStatus, getStatusColor, RequestStatusIcon } from "utils/request.status.utils";
import { useDevtoolsContext } from "devtools.context";

const baseStyle = {
  fontWeight: 300,
  fontSize: "14px",
  padding: "4px 5px",
};

export const Request = ({ item }: { item: DevtoolsRequestEvent }) => {
  const { setDetailsRequestId } = useDevtoolsContext("DevtoolsNetworkRequest");

  const status = useMemo(() => {
    return getStatus(item);
  }, [item]);

  const color = useMemo(() => {
    return getStatusColor(status);
  }, [status]);

  return (
    <tr onClick={() => setDetailsRequestId(item.requestId)} className="hf-tr-active">
      <td style={{ ...baseStyle, color, paddingLeft: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <RequestStatusIcon status={status} />
          <span>{item.request.endpoint}</span>
        </div>
      </td>
      <td style={{ ...baseStyle, color }}>{status}</td>
      <td style={{ ...baseStyle, color }}>{String(item.request.method)}</td>
      <td style={{ ...baseStyle, color }}>{String(item.response?.status || "")}</td>
      <td style={{ ...baseStyle, color }}>{new Date(item.addedTimestamp).toLocaleTimeString()} </td>
      <td style={{ ...baseStyle, color, paddingRight: "10px" }}>
        {!!item.details?.timestamp && (
          <div>
            {new Date(item.details.timestamp).toLocaleTimeString()}{" "}
            <span style={{ color: "#a7a7a7" }}>({item.details.timestamp - item.addedTimestamp}ms)</span>
          </div>
        )}
      </td>
    </tr>
  );
};
