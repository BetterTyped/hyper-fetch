import { QueueDataType } from "@hyper-fetch/core";

import { Chip } from "components/chip/chip";
import { getQueueStatus, getQueueStatusColor } from "utils/queue.status.utils";

import { styles } from "pages/processing/processing.styles";

export const Card = ({ queue }: { queue: QueueDataType }) => {
  const css = styles.useStyles();
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
      className={css.card}
      style={{
        border: `1px solid ${getQueueStatusColor(queue, 1)}`,
        boxShadow: `0 3px 6px ${getQueueStatusColor(queue, 0.16, true)}, 0 3px 6px  ${getQueueStatusColor(queue, 0.23, true)}`,
      }}
    >
      <div className={css.cardHeader}>
        <div className={css.title}>
          <svg
            fill="none"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
            id="fi_16510343"
          >
            <path
              d="m4.5 14h15m-15 4h15m-13.5-8h12c1.1046 0 2-.89543 2-2 0-1.10457-.8954-2-2-2h-12c-1.10457 0-2 .89543-2 2 0 1.10457.89543 2 2 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          Queue
        </div>
        <Chip color={statusColor}>{status}</Chip>
      </div>
      <div className={css.cardContent}>
        <span className={css.value}>{queue.requests.length}</span>
        <span>Active request{queue.requests.length === 1 ? "" : "s"}</span>
      </div>
      <div className={css.cardFooter}>
        <span style={{ color: "rgb(88 196 220)" }}>Queue Key:</span> <span>{queue.queueKey}</span>
      </div>
    </div>
  );
};
