import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles(({ isLight, css }) => {
  return {
    wrapper: css`
      overflow-y: auto;
      padding: 10 20px;
    `,
    row: css`
      display: flex;
      flex-direction: row;
      gap: 10px;
      flex-wrap: wrap;
    `,
    buttons: css`
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px;
      padding: 6px 10px;
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
      color: ${isLight ? tokens.colors.light[900] : tokens.colors.light[100]};
    `,
    cardFooter: css`
      text-align: left;
      margin-top: 5px;
      font-size: 12px;
      font-weight: 500;
      max-width: 200px;
    `,
    footerRow: css`
      margin-top: 5px;
    `,
    details: css`
      position: absolute !important;
      display: flex;
      flex-direction: column;
      top: 0px;
      right: 0px;
      bottom: 0px;
      background: ${isLight ? tokens.colors.light[100] : tokens.colors.dark[700]};
      border-left: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
    `,
    detailsContent: css`
      overflow-y: auto;
      padding-bottom: 10px;
    `,
  };
});
