import { useMemo } from "react";
import { useQueue } from "@hyper-fetch/react";
import { ListXIcon, PauseIcon, PlayIcon } from "lucide-react";
import { Request } from "@hyper-fetch/core";

import { Back } from "./back/back";
import { Separator } from "frontend/components/separator/separator";
import { Button } from "frontend/components/button/button";
import { useDevtoolsContext } from "frontend/pages/project/_context/devtools.context";
import { Collapsible } from "frontend/components/collapsible/collapsible";
import * as Table from "frontend/components/table/table";
import { RowInfo } from "frontend/components/table/row-info/row-info";
import { getQueueStatus, QueueStatus } from "frontend/utils/queue.status.utils";
import { Chip } from "frontend/components/chip/chip";
import { DevtoolsRequestQueueStats } from "frontend/pages/project/_context/devtools.types";
import { Key } from "frontend/components/key/key";
import { Bar } from "frontend/components/bar/bar";
import { Sidebar } from "frontend/components/sidebar/sidebar";
import { createStyles } from "frontend/theme/use-styles.hook";

export const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    content: css`
      overflow-y: auto;
    `,
    buttons: css`
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px;
      padding: 6px 0 0;
    `,
    block: css`
      padding: 10px;
    `,
    details: css`
      position: absolute !important;
      display: flex;
      flex-direction: column;
      top: 0px;
      right: 0px;
      bottom: 0px;
      border-left: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
    `,
  };
});

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

export const QueuesDetails = () => {
  const css = styles.useStyles();

  const { client, stats, queues, detailsQueueKey } = useDevtoolsContext("DevtoolsQueueDetails");

  const item = useMemo(() => {
    if (!detailsQueueKey) return null;
    return queues.find((request) => request.queryKey === detailsQueueKey);
  }, [detailsQueueKey, queues]);

  const status = item ? getQueueStatus(item) : QueueStatus.PENDING;

  const dummyRequest = useMemo(() => {
    return new Request(client, {
      endpoint: "",
      queryKey: item?.queryKey,
      method: item?.queryKey.split("_")[0],
    });
  }, [client, item?.queryKey]);

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
      statistics: item ? stats[item.queryKey] || defaultStats : defaultStats,
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
    if (item) {
      dispatcher.cancelRunningRequests(item.queryKey);
      dispatcher.clearQueue(item.queryKey);
    }
  };

  // TODO NO CONTENT
  if (!item) return null;

  return (
    <Sidebar
      position="right"
      className={css.details}
      defaultSize={{
        width: "70%",
      }}
      minWidth="400px"
      maxWidth="100%"
      minHeight="100%"
      maxHeight="100%"
    >
      <Bar style={{ flexWrap: "nowrap", justifyContent: "flex-start" }}>
        <Back />
        <Separator style={{ height: "18px", margin: "0 4px 0 0" }} />
        <Key value={item.queryKey} type="queue" />
        <Chip color={color}>{status}</Chip>
        <div style={{ flex: "1 1 auto" }} />
      </Bar>
      <div className={css.content}>
        <div className={css.block}>
          <Table.Root>
            <Table.Body>
              <RowInfo label="Total Requests:" value={<Chip color="gray">{statistics.total}</Chip>} />
              <RowInfo label="Success Requests:" value={<Chip color="green">{statistics.success}</Chip>} />
              <RowInfo label="Failed Requests:" value={<Chip color="red">{statistics.failed}</Chip>} />
              <RowInfo label="Canceled Requests:" value={<Chip color="orange">{statistics.canceled}</Chip>} />
              <RowInfo label="In Progress Requests:" value={<Chip color="blue">{item.requests.length}</Chip>} />
            </Table.Body>
          </Table.Root>
          <div className={css.buttons}>
            <Button color={stopped ? "blue" : "orange"} onClick={toggleQueue}>
              {stopped ? <PlayIcon /> : <PauseIcon />}
              {stopped ? "Play" : "Stop"}
            </Button>
            <Button color="gray" disabled={!requests.length} onClick={clear}>
              <ListXIcon />
              Clear
            </Button>
          </div>
        </div>

        <Collapsible title="Response times" defaultOpen>
          <div className={css.block}>
            <Table.Root>
              <Table.Body>
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
              </Table.Body>
            </Table.Root>
          </div>
        </Collapsible>
        <Collapsible title="Processing times" defaultOpen>
          <div className={css.block}>
            <Table.Root>
              <Table.Body>
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
              </Table.Body>
            </Table.Root>
          </div>
        </Collapsible>
        <Collapsible title="Queue times" defaultOpen>
          <div className={css.block}>
            <Table.Root>
              <Table.Body>
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
              </Table.Body>
            </Table.Root>
          </div>
        </Collapsible>
      </div>
    </Sidebar>
  );
};
