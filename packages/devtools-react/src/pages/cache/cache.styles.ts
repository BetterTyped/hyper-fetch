import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles((theme, css) => {
  return {
    wrapper: css`
      overflow-y: auto;
    `,
    row: css`
      cursor: pointer;
      &:nth-child(2n + 1) {
        background: rgba(0, 0, 0, 0.1);
      }
      &:hover {
        background: rgb(58 66 79);
      }
    `,
    cell: css`
      font-weight: 300;
      font-size: 14px;
      padding: 4px 5px;
      &:first-child {
        padding-left: 10px;
      }
      &:last-child {
        padding-right: 10px;
      }
    `,
    label: css`
      font-weight: 400;
      font-size: 14px;
      padding: 8px 5px;
      text-align: left;
      color: #60d6f6;
    `,
    tbody: css`
      position: relative;
    `,
  };
});
