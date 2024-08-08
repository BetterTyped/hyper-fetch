/* eslint-disable react/no-array-index-key */
import { useMemo } from "react";

import { useDevtoolsContext } from "devtools.context";
import { Request } from "./request/request";
import { Table } from "components/table/table";
import { NoContent } from "components/no-content/no-content";
import { useNetworkContext } from "../network.context";
import { Status } from "utils/request.status.utils";

const thStyle = {
  fontWeight: 400,
  fontSize: "14px",
  padding: "8px 5px",
};

export const Content = () => {
  const { requests } = useDevtoolsContext("DevtoolsNetworkContent");
  const { filter } = useNetworkContext("ToolbarNetwork");

  const items = useMemo(() => {
    if (!filter) return requests;
    switch (filter) {
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
  }, [requests, filter]);

  return (
    <>
      <Table>
        <thead style={{ opacity: !requests.length ? 0.4 : 1 }}>
          <tr style={{ textAlign: "left", color: "#60d6f6" }}>
            <th style={{ ...thStyle, paddingLeft: "10px" }}>Endpoint</th>
            <th style={{ ...thStyle }}>Status</th>
            <th style={{ ...thStyle }}>Method</th>
            <th style={{ ...thStyle }}>Status</th>
            <th style={{ ...thStyle }}>Added Time</th>
            <th style={{ ...thStyle, paddingRight: "10px" }}>Response Time</th>
          </tr>
        </thead>
        <tbody style={{ position: "relative" }}>
          {items.map((item, index) => {
            return <Request key={index} item={item} />;
          })}
        </tbody>
      </Table>
      {!items.length && <NoContent style={{ marginTop: "40px" }} text="Make some request to see them here!" />}
    </>
  );
};
