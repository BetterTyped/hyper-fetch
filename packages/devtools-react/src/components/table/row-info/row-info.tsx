import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    row: css`
      display: flex;
      gap: 5px;
      align-items: center;
      font-size: 14px;
    `,
    label: css`
      font-weight: 400;
      padding: 3px 0;
    `,
    value: css`
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 3px 0;
      font-weight: 300;
    `,
  };
});

export const RowInfo = ({ label, value }: { label: string; value: string }) => {
  const css = styles.useStyles();
  return (
    <tr className={css.row}>
      <td className={css.label}>{label}</td>
      <td className={css.value}>{value}</td>
    </tr>
  );
};
