import { createStyles } from "theme/use-styles.hook";
import { QueuesToolbar } from "./toolbar/queues.toolbar";
import { QueuesList } from "./list/queues.list";
import { QueuesDetails } from "./details/queues.details";
import { useDevtoolsContext } from "devtools.context";

const styles = createStyles(({ css }) => {
  return {
    base: css`
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
    `,
    content: css`
      display: flex;
      flex-direction: row;
      flex: 1 1 auto;
      height: 100%;
    `,
  };
});

export const Queues = () => {
  const { detailsQueueKey } = useDevtoolsContext("DevtoolsQueues");
  const css = styles.useStyles();
  return (
    <div className={css.base}>
      <QueuesToolbar />
      <div className={css.content}>{detailsQueueKey ? <QueuesDetails /> : <QueuesList />}</div>
    </div>
  );
};
