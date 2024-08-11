import { QueueDataType } from "@hyper-fetch/core";

import { Chip } from "components/chip/chip";
import { getQueueStatus, getQueueStatusColor } from "utils/queue.status.utils";
import { StackIcon } from "icons/stack";
import { useDevtoolsContext } from "devtools.context";

import { styles } from "pages/processing/processing.styles";

export const Card = ({ queue, type }: { queue: QueueDataType; type: "fetchDispatcher" | "submitDispatcher" }) => {
  const css = styles.useStyles();
  const status = getQueueStatus(queue);
  const { setDetailsQueue } = useDevtoolsContext("}DevtoolsProcessingCard");

  const statusColor = (
    {
      Pending: "gray",
      Running: "blue",
      Stopped: "orange",
    } as const
  )[status];

  return (
    <button
      type="button"
      className={css.card}
      style={{
        border: `1px solid ${getQueueStatusColor(queue, 1)}`,
        boxShadow: `0 3px 6px ${getQueueStatusColor(queue, 0.16, true)}, 0 3px 6px  ${getQueueStatusColor(queue, 0.23, true)}`,
      }}
      onClick={() => setDetailsQueue({ queueKey: queue.queueKey, type })}
    >
      <div className={css.cardHeader}>
        <div className={css.title}>
          <StackIcon />
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
    </button>
  );
};
