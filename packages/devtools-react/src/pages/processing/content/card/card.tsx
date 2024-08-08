import { QueueDataType } from "@hyper-fetch/core";

import { Chip } from "components/chip/chip";
import { getQueueStatus, getQueueStatusColor } from "utils/queue.status.utils";

export const Card = ({ queue }: { queue: QueueDataType }) => {
  const status = getQueueStatus(queue);

  const statusColor = (
    {
      Pending: "gray",
      Running: "blue",
      Stopped: "orange",
    } as const
  )[status];

  return (
    <div
      className="card"
      style={{
        border: `1px solid ${getQueueStatusColor(queue, 1)}`,
        boxShadow: `0 3px 6px ${getQueueStatusColor(queue, 0.16, true)}, 0 3px 6px  ${getQueueStatusColor(queue, 0.23, true)}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          gap: "15px",
          marginBottom: "5px",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 700 }}>Queue</div>
        <Chip color={statusColor}>{status}</Chip>
      </div>
      <div
        style={{
          marginBottom: "5px",
          color: "#fff",
        }}
      >
        <span style={{ fontSize: "28px", fontWeight: 700, marginRight: "5px" }}>{queue.requests.length}</span>
        <span style={{ fontSize: "14px" }}>Active request{queue.requests.length === 1 ? "" : "s"}</span>
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 500,
          maxWidth: "200px",
        }}
      >
        <span style={{ color: "rgb(88 196 220)" }}>Queue Key:</span> <span>{queue.queueKey}</span>
      </div>
    </div>
  );
};
