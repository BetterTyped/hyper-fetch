import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((isLight, css) => {
  return {
    base: css`
      width: 100%;
      border-spacing: 0;

      & tbody tr:nth-child(2n + 1) {
        background: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[700]};
      }

      & tbody tr[role="button"]:focus-within {
        outline-offset: -2px;
        outline: 2px solid ${tokens.colors.cyan[300]};
      }

      & td {
        max-width: 200px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      & td * {
        max-width: 200px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      & tbody {
        position: relative;
      }

      & td:first-child {
        padding-left: 10px;
      }
      & td:last-child {
        padding-right: 10px;
      }

      & th:first-child {
        padding-left: 10px;
      }
      & th:last-child {
        padding-right: 10px;
      }
    `,
  };
});

export const Table = (props: React.HTMLProps<HTMLTableElement>) => {
  const { className } = props;
  const css = styles.useStyles();

  return (
    <div style={{ overflow: "auto", paddingBottom: "5px" }}>
      <table {...props} className={styles.clsx(css.base, className)} />
    </div>
  );
};
