import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
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
      min-height: 24px;
    `,
    label: css`
      font-weight: 300;
      font-size: 12px;
    `,
    value: css`
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 400;
      font-size: 12px;
      color: #fff;
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
