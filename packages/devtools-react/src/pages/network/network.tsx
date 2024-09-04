import { createStyles } from "theme/use-styles.hook";
import { NetworkDetails } from "./details/network.details";
import { NetworkSidebar } from "./sidebar/network.sidebar";
import { NetworkToolbar } from "./toolbar/network.toolbar";

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

export const Network = () => {
  const css = styles.useStyles();
  return (
    <div className={css.base}>
      <NetworkToolbar />
      <div className={css.content}>
        <NetworkSidebar />
        <NetworkDetails />
      </div>
    </div>
  );
};
