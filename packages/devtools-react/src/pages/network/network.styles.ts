import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles((isLight, css) => {
  return {
    row: css`
      cursor: pointer;
      &:hover {
        background: ${isLight ? tokens.colors.light[100] : tokens.colors.dark[500]}!important;
      }
    `,
    activeRow: css`
      box-shadow: inset 0px 0px 2px 1px ${isLight ? tokens.colors.blue[400] : tokens.colors.blue[400]}!important;
    `,
    cell: css`
      font-weight: 300;
      font-size: 14px;
      padding: 4px 8px;
      &:first-child {
        padding-left: 10px;
      }
      &:last-child {
        padding-right: 10px;
      }
    `,
    tbody: css`
      position: relative;
    `,
    endpointCell: css`
      display: flex;
      align-items: center;
      gap: 4px;

      & svg {
        min-width: 14px;
      }
    `,
    timestamp: css`
      color: ${isLight ? tokens.colors.light[700] : tokens.colors.light[700]};
    `,
    buttons: css`
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px;
      padding: 6px 10px;
    `,
    toolbarRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0px 10px;
      gap: 5px;
    `,
    name: css`
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    spacer: css`
      flex: 1 1 auto;
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
  };
});
