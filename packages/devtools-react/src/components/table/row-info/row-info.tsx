import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((isLight, css) => {
  return {
    row: css`
      display: flex;
      gap: 5px;
      align-items: center;
      background: transparent !important;
    `,
    content: css`
      display: flex;
      align-items: center;
    `,
    label: css`
      font-weight: 400;
      font-size: 13px;
    `,
    value: css`
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
      font-size: 13px;
      color: ${isLight ? tokens.colors.light[800] : tokens.colors.light[100]};
      max-width: 100% !important;

      & * {
        max-width: 100% !important;
      }
    `,
  };
});

export const RowInfo = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const css = styles.useStyles();
  return (
    <tr className={css.row}>
      <td className={css.label}>{label}</td>
      <td className={css.value}>
        <div className={css.content}>{value}</div>
      </td>
    </tr>
  );
};
