import { CpuIcon } from "lucide-react";
import { QueueDataType } from "@hyper-fetch/core";

import { Chip } from "frontend/components/chip/chip";
import { getQueueStatus, getQueueStatusColor } from "frontend/utils/queue.status.utils";
import { useDevtoolsContext } from "frontend/pages/project/_context/devtools.context";
import { tokens } from "frontend/theme/tokens";
import { CardButton } from "frontend/components/card-button/card-button";
import { createStyles } from "frontend/theme/use-styles.hook";
import { Key } from "frontend/components/key/key";

const styles = createStyles(({ isLight, css }) => {
  return {
    cardHeader: css`
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 15px;
      margin-bottom: 5px;
    `,
    title: css`
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 700;
      & svg {
        width: 22px;
        height: 22px;
        stroke: gray;
      }
    `,
    cardContent: css`
      font-size: 12px;
      font-weight: 500;
    `,
    value: css`
      font-size: 28px;
      font-weight: 700;
      margin-right: 5px;
      color: ${isLight ? tokens.colors.light[900] : tokens.colors.light[100]};
    `,
    cardFooter: css`
      text-align: left;
      margin-top: 5px;
      font-size: 12px;
      font-weight: 500;
      max-width: 180px;
    `,
    key: css`
      font-size: 12px;
    `,
    description: css`
      display: flex;
      margin-top: -5px;
      margin-bottom: 10px;
      color: ${isLight ? tokens.colors.cyan[400] : tokens.colors.cyan[500]};
      font-weight: 400;
      font-size: 12px;

      & strong {
        margin-right: 3px;
      }
    `,
  };
});
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

  const total = (stats[queue.queryKey]?.total || 0) + queue.requests.length;

  return (
    <CardButton
      color={getQueueStatusColor({ queue, active: detailsQueueKey === queue.queryKey && !queue.stopped })}
      onClick={() => setDetailsQueueKey(queue.queryKey)}
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
        <div className={css.description}>
          (<strong>{total} </strong> in total)
        </div>
        <Key className={css.key} type="queue" value={queue.queryKey} />
      </div>
    </CardButton>
  );
};
