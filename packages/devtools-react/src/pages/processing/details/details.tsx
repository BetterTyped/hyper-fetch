import { useMemo } from "react";
import { Resizable } from "re-resizable";

import { Back } from "./back/back";
import { Separator } from "components/separator/separator";
import { Button } from "components/button/button";
import { Toolbar } from "components/toolbar/toolbar";
import { useDevtoolsContext } from "devtools.context";
import { Collapsible } from "components/collapsible/collapsible";
import { Table } from "components/table/table";
import { RowInfo } from "components/table/row-info/row-info";
import { getQueueStatus } from "utils/queue.status.utils";
import { Chip } from "components/chip/chip";
import { DevtoolsRequestQueueStats } from "devtools.types";

import { styles } from "../processing.styles";

const nameStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const buttonsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const defaultStats: DevtoolsRequestQueueStats = {
  total: 0,
  success: 0,
  failed: 0,
  canceled: 0,
  avgTime: 0,
};

export const Details = ({ queueKey }: { queueKey: string }) => {
  const css = styles.useStyles();

  const { client, stats } = useDevtoolsContext("DevtoolsCacheDetails");

  // TODO: Create use queue hook
  const { queue, status, color, statistics } = useMemo(() => {
    const queueElement = client.fetchDispatcher.getQueue(queueKey) || client.submitDispatcher.getQueue(queueKey);
    const statusValue = getQueueStatus(queueElement);

    const statusColor = (
      {
        Pending: "gray",
        Running: "blue",
        Stopped: "orange",
      } as const
    )[statusValue];

    return {
      queue: queueElement,
      status: statusValue,
      color: statusColor,
      statistics: stats[queueKey] || defaultStats,
    };
  }, [client.fetchDispatcher, client.submitDispatcher, queueKey, stats]);

  return (
    <Resizable
      bounds="parent"
      defaultSize={{ width: "60%", height: "100%" }}
      maxWidth="90%"
      minWidth="200px"
      boundsByDirection
      className={css.details}
    >
      <Toolbar>
        <Back />
        <Separator style={{ height: "18px", margin: "0 12px" }} />
        <div style={{ ...nameStyle }}>
          {queue.queueKey}
          <Chip color={color}>{status}</Chip>
        </div>
        <div style={{ flex: "1 1 auto" }} />
        <div style={{ ...buttonsStyle }}>
          <Button color="secondary">Stop</Button>
          <Button color="error">Clear</Button>
        </div>
      </Toolbar>
      <div className={css.detailsContent}>
        <Collapsible title="General" defaultOpen>
          <div style={{ padding: "10px" }}>
            <Table>
              <tbody>
                <RowInfo label="Total Requests:" value={<Chip color="blue">{statistics.total}</Chip>} />
                <RowInfo label="Success Requests:" value={<Chip color="blue">{statistics.success}</Chip>} />
                <RowInfo label="Failed Requests:" value={<Chip color="blue">{statistics.failed}</Chip>} />
                <RowInfo label="Canceled Requests:" value={<Chip color="blue">{statistics.canceled}</Chip>} />
                <RowInfo
                  label="Average Time:"
                  value={<Chip color="blue">{parseInt(String(statistics.avgTime), 10)}ms</Chip>}
                />
              </tbody>
            </Table>
          </div>
        </Collapsible>
      </div>
    </Resizable>
  );
};
