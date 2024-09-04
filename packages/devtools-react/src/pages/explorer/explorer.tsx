import { createStyles } from "theme/use-styles.hook";
import { ExplorerToolbar } from "./toolbar/explorer.toolbar";
import { ExplorerSidebar } from "./sidebar/explorer.sidebar";
import { ExplorerDetails } from "./details/explorer.details";

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

export const Explorer = () => {
  const css = styles.useStyles();
  return (
    <div className={css.base}>
      <ExplorerToolbar />
      <div className={css.content}>
        <ExplorerSidebar />
        <ExplorerDetails />
      </div>
    </div>
  );
};
