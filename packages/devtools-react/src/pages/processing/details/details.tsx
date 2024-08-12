import { useMemo } from "react";
import { Resizable } from "re-resizable";
import { QueueDataType } from "@hyper-fetch/core";

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
  avgQueueTime: 0,
  avgProcessingTime: 0,
};

export const Details = ({ item }: { item: QueueDataType }) => {
  const css = styles.useStyles();

  const { stats } = useDevtoolsContext("DevtoolsCacheDetails");

  const status = getQueueStatus(item);

  const { queue, color, statistics } = useMemo(() => {
    const statusColor = (
      {
        Pending: "gray",
        Running: "blue",
        Stopped: "orange",
      } as const
    )[status];

    return {
      queue: item,
      status,
      color: statusColor,
      statistics: stats[item.queueKey] || defaultStats,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, item?.requests?.length, stats, status]);

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
                <RowInfo label="In Progress Requests:" value={<Chip color="blue">{item.requests.length}</Chip>} />
                <RowInfo
                  label="Average time spent in queue:"
                  value={<Chip color="blue">{parseInt(String(statistics.avgQueueTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Average pre-processing time:"
                  value={<Chip color="blue">{parseInt(String(statistics.avgProcessingTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Average request time:"
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
