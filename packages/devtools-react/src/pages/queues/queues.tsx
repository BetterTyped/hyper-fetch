import { createStyles } from "theme/use-styles.hook";
import { QueuesToolbar } from "./toolbar/queues.toolbar";
import { QueuesSidebar } from "./sidebar/queues.sidebar";
import { QueuesDetails } from "./details/queues.details";

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
  const css = styles.useStyles();
  return (
    <div className={css.base}>
      <QueuesToolbar />
      <div className={css.content}>
        <QueuesSidebar />
        <QueuesDetails />
      </div>
    </div>
  );
};
