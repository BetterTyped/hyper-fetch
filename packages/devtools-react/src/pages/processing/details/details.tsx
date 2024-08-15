import { useMemo } from "react";
import { Resizable } from "re-resizable";
import { useQueue } from "@hyper-fetch/react";
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
import { StopIcon } from "icons/stop";
import { PlayIcon } from "icons/play";
import { ClearIcon } from "icons/clear";

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
  minTime: 0,
  maxTime: 0,
  lastTime: 0,
  avgQueueTime: 0,
  minQueueTime: 0,
  maxQueueTime: 0,
  lastQueueTime: 0,
  avgProcessingTime: 0,
  minProcessingTime: 0,
  maxProcessingTime: 0,
  lastProcessingTime: 0,
};

export const Details = ({ item }: { item: QueueDataType }) => {
  const css = styles.useStyles();

  const { client, stats } = useDevtoolsContext("DevtoolsCacheDetails");

  const status = getQueueStatus(item);

  const dummyRequest = useMemo(() => {
    return client.createRequest()({ endpoint: "", queueKey: item.queueKey, method: item.queueKey.split("_")[0] });
  }, [client, item.queueKey]);

  const { start, stop, stopped, requests, dispatcher } = useQueue(dummyRequest);

  const { color, statistics } = useMemo(() => {
    const statusColor = (
      {
        Pending: "gray",
        Running: "blue",
        Stopped: "orange",
      } as const
    )[status];

    return {
      status,
      color: statusColor,
      statistics: stats[item.queueKey] || defaultStats,
    };
  }, [item, stats, status]);

  const toggleQueue = () => {
    if (stopped) {
      start();
    } else {
      stop();
    }
  };

  const clear = () => {
    dispatcher.cancelRunningRequests(item.queueKey);
    dispatcher.clearQueue(item.queueKey);
  };

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
          {item.queueKey}
          <Chip color={color}>{status}</Chip>
        </div>
        <div style={{ flex: "1 1 auto" }} />
        <div style={{ ...buttonsStyle }}>
          <Button color={stopped ? "blue" : "red"} onClick={toggleQueue}>
            {stopped ? <PlayIcon /> : <StopIcon />}
            {stopped ? "Play" : "Stop"}
          </Button>
          <Button color="gray" disabled={!requests.length} onClick={clear}>
            <ClearIcon />
            Clear
          </Button>
        </div>
      </Toolbar>
      <div className={css.detailsContent}>
        <Collapsible title="General" defaultOpen>
          <div style={{ padding: "10px" }}>
            <Table>
              <tbody>
                <RowInfo label="Total Requests:" value={<Chip color="gray">{statistics.total}</Chip>} />
                <RowInfo label="Success Requests:" value={<Chip color="green">{statistics.success}</Chip>} />
                <RowInfo label="Failed Requests:" value={<Chip color="red">{statistics.failed}</Chip>} />
                <RowInfo label="Canceled Requests:" value={<Chip color="orange">{statistics.canceled}</Chip>} />
                <RowInfo label="In Progress Requests:" value={<Chip color="blue">{item.requests.length}</Chip>} />
              </tbody>
            </Table>
          </div>
        </Collapsible>
        <Collapsible title="Response times" defaultOpen>
          <div style={{ padding: "10px" }}>
            <Table>
              <tbody>
                <RowInfo
                  label="Last response time:"
                  value={<Chip color="blue">{parseInt(String(statistics.lastTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Min response time:"
                  value={<Chip color="blue">{parseInt(String(statistics.minTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Max response time:"
                  value={<Chip color="blue">{parseInt(String(statistics.maxTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Average response time:"
                  value={<Chip color="blue">{parseInt(String(statistics.avgTime), 10)}ms</Chip>}
                />
              </tbody>
            </Table>
          </div>
        </Collapsible>
        <Collapsible title="Processing times" defaultOpen>
          <div style={{ padding: "10px" }}>
            <Table>
              <tbody>
                <RowInfo
                  label="Last pre-processing time:"
                  value={<Chip color="blue">{parseInt(String(statistics.lastProcessingTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Min pre-processing time:"
                  value={<Chip color="blue">{parseInt(String(statistics.minProcessingTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Max pre-processing time:"
                  value={<Chip color="blue">{parseInt(String(statistics.maxProcessingTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Average pre-processing time:"
                  value={<Chip color="blue">{parseInt(String(statistics.avgProcessingTime), 10)}ms</Chip>}
                />
              </tbody>
            </Table>
          </div>
        </Collapsible>
        <Collapsible title="Queue times" defaultOpen>
          <div style={{ padding: "10px" }}>
            <Table>
              <tbody>
                <RowInfo
                  label="Last queue time:"
                  value={<Chip color="blue">{parseInt(String(statistics.avgQueueTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Min time spent in queue:"
                  value={<Chip color="blue">{parseInt(String(statistics.minQueueTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Max time spent in queue:"
                  value={<Chip color="blue">{parseInt(String(statistics.maxQueueTime), 10)}ms</Chip>}
                />
                <RowInfo
                  label="Average time spent in queue:"
                  value={<Chip color="blue">{parseInt(String(statistics.avgQueueTime), 10)}ms</Chip>}
                />
              </tbody>
            </Table>
          </div>
        </Collapsible>
      </div>
    </Resizable>
  );
};
