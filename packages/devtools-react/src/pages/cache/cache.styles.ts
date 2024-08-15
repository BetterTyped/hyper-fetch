import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles((theme, css) => {
  return {
    wrapper: css`
      overflow-y: auto;
    `,
    spacer: css`
      flex: 1 1 auto;
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
    buttons: css`
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px;
      padding: 6px 10px;
    `,
    details: css`
      position: absolute !important;
      display: flex;
      flex-direction: column;
      top: 0px;
      right: 0px;
      bottom: 0px;
      background: rgb(32 34 42);
      border-left: 1px solid rgb(61, 66, 74);
    `,
    detailsContent: css`
      overflow-y: auto;
      padding-bottom: 10px;
    `,
  };
});
