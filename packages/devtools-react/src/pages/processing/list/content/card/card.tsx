import { RefreshCcwDotIcon } from "lucide-react";
import { QueueDataType } from "@hyper-fetch/core";

import { Chip } from "components/chip/chip";
import { getQueueStatus, getQueueStatusColor } from "utils/queue.status.utils";
import { useDevtoolsContext } from "devtools.context";
import { tokens } from "theme/tokens";

import { styles } from "../../processing.styles";

export const Card = ({ queue }: { queue: QueueDataType }) => {
  const css = styles.useStyles();
  const status = getQueueStatus(queue);
  const { stats, setDetailsQueueKey, theme, detailsQueueKey } = useDevtoolsContext("DevtoolsProcessingCard");

  const statusColor = (
    {
      Pending: "gray",
      Running: "blue",
      Stopped: "orange",
    } as const
  )[status];

  const total = (stats[queue.queueKey]?.total || 0) + queue.requests.length;
  const isLight = theme === "light";

  return (
    <button
      type="button"
      className={css.clsx(
        css.card,
        { [css.active]: detailsQueueKey === queue.queueKey && !queue.stopped },
        { [css.activeBackground]: detailsQueueKey === queue.queueKey },
      )}
      style={{
        border: `1px solid ${getQueueStatusColor({ queue, alpha: tokens.alpha[70], isLight })}`,
        boxShadow: `0 3px 6px ${getQueueStatusColor({ queue, alpha: tokens.alpha[30], isLight, custom: isLight ? tokens.colors.light[300] : tokens.colors.dark[800] })}, 0px 0px 6px  ${getQueueStatusColor({ queue, alpha: tokens.alpha[40], isLight, custom: isLight ? tokens.colors.light[500] : tokens.colors.dark[900] })}`,
      }}
      onClick={() => setDetailsQueueKey(queue.queueKey)}
    >
      <div className={css.cardHeader}>
        <div className={css.title}>
          <RefreshCcwDotIcon />
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
    </button>
  );
};
