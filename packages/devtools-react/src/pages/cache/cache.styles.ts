import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles((isLight, css) => {
  return {
    wrapper: css`
      overflow-y: auto;
    `,
    spacer: css`
      flex: 1 1 auto;
    `,
    row: css`
      cursor: pointer;
      &:hover {
        background: ${isLight ? tokens.colors.light[100] : tokens.colors.dark[500]}!important;
      }
    `,
    activeRow: css`
      outline: 2px solid ${isLight ? tokens.colors.cyan[400] : tokens.colors.cyan[400]}!important;
      outline-offset: -2px !important;
    `,
    cell: css`
      font-weight: 300;
      font-size: 14px;
      padding: 4px 8px;
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
      background: ${isLight ? tokens.colors.light[100] : tokens.colors.dark[700]};
      border-left: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
    `,
    detailsContent: css`
      overflow-y: auto;
      padding-bottom: 10px;
    `,
  };
});
