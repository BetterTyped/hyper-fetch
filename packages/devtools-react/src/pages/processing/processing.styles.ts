import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles((theme, css) => {
  return {
    wrapper: css`
      overflow-y: auto;
    `,
    row: css`
      display: flex;
      flex-direction: row;
      gap: 10px;
      flex-wrap: wrap;
    `,
    card: css`
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 10px;
      border-radius: 8px;
      margin: 10px;
      min-width: 180px;
      background: transparent;
      color: rgb(180, 194, 204);
    `,
    cardHeader: css`
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 15px;
      margin-bottom: 5px;
    `,
    title: css`
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 700;
      & svg {
        width: 22px;
        height: 22px;
      }
      & path {
        stroke: gray;
      }
    `,
    cardContent: css`
      font-size: 12px;
      font-weight: 500;
    `,
    value: css`
      font-size: 28px;
      font-weight: 700;
      margin-right: 5px;
      color: #fff;
    `,
    cardFooter: css`
      margin-top: 10px;
      font-size: 12px;
      font-weight: 500;
      max-width: 200px;
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
