import { tokens } from "frontend/theme/tokens";
import { createStyles } from "frontend/theme/use-styles.hook";

export const styles = createStyles(({ isLight, css }) => {
  return {
    content: css``,
    row: css`
      display: flex;
      gap: 10px;
      padding: 10px 8px;
    `,
    item: css`
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
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
    block: css`
      padding: 10px;
    `,
    head: css`
      display: flex;
      align-items: center;
      flex: 1 1 auto;
      font-size: 14px;
      gap: 10px;
    `,
    bar: css`
      display: flex;
      align-items: center;
      gap: 3px;
      background: ${isLight ? tokens.colors.light[300] : tokens.colors.dark[500]};
      border: none;
      border-radius: 6px;
      color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[300]};
      font-size: 16px;
      padding: 4px 10px 4px 4px;
      width: 100%;
    `,
    endpoint: css`
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
      font-size: 14px;
      font-weight: 400;

      & span {
        font-weight: 500;
        display: inline-block;
        color: ${isLight ? tokens.colors.cyan[800] : tokens.colors.cyan[200]};
        opacity: 0.6;
      }
    `,
    tabs: css`
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      gap: 10px;
      padding: 10px;
    `,
  };
});
