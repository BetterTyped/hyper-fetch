import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    base: css`
      width: 100%;
      border-spacing: 0;
    `,
  };
});

export const Table = (props: React.HTMLProps<HTMLTableElement>) => {
  const { className } = props;
  const css = styles.useStyles();

  return (
    <div style={{ overflow: "auto" }}>
      <table {...props} className={styles.clsx(css.base, className)} />
    </div>
  );
};
