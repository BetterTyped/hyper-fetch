import { CpuIcon } from "lucide-react";
import { QueueDataType } from "@hyper-fetch/core";

import { Chip } from "components/chip/chip";
import { getQueueStatus, getQueueStatusColor } from "utils/queue.status.utils";
import { useDevtoolsContext } from "devtools.context";
import { tokens } from "theme/tokens";
import { CardButton } from "components/card-button/card-button";

import { styles } from "../queues.styles";

export const Card = ({ queue }: { queue: QueueDataType }) => {
  const css = styles.useStyles();
  const status = getQueueStatus(queue);
  const { stats, setDetailsQueueKey, detailsQueueKey } = useDevtoolsContext("DevtoolsProcessingCard");

  const statusColor = (
    {
      Pending: "gray",
      Running: "blue",
      Stopped: "orange",
    } as const
  )[status];

  const total = (stats[queue.queueKey]?.total || 0) + queue.requests.length;

  return (
    <CardButton
      color={getQueueStatusColor({ queue, active: detailsQueueKey === queue.queueKey && !queue.stopped })}
      onClick={() => setDetailsQueueKey(queue.queueKey)}
    >
      <div className={css.cardHeader}>
        <div className={css.title}>
          <CpuIcon />
          Queue
        </div>
        <Chip color={statusColor}>{status}</Chip>
      </div>
      <div className={css.cardContent}>
        <span className={css.value}>{queue.requests.length}</span>
        <span>Active request{queue.requests.length === 1 ? "" : "s"}</span>
      </div>
      <div className={css.cardFooter}>
        <div className={css.footerRow}>
          <span style={{ color: tokens.colors.cyan[500] }}>Total:</span>{" "}
          <span>
            {total} request{total !== 1 ? "s" : ""}
          </span>
        </div>
        <div className={css.footerRow}>
          <span style={{ color: tokens.colors.cyan[500] }}>Key:</span> <span>{queue.queueKey}</span>
        </div>
      </div>
    </CardButton>
  );
};
