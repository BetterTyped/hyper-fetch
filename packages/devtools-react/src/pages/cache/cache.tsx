import { createStyles } from "theme/use-styles.hook";
import { CacheToolbar } from "./toolbar/cache.toolbar";
import { CacheSidebar } from "./sidebar/cache.sidebar";
import { CacheDetails } from "./details/cache.details";

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

export const Cache = () => {
  const css = styles.useStyles();
  return (
    <div className={css.base}>
      <CacheToolbar />
      <div className={css.content}>
        <CacheSidebar />
        <CacheDetails />
      </div>
    </div>
  );
};
