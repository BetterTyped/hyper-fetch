import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles((isLight, css) => {
  return {
    content: css``,
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
      flex: 1 1 auto;
      gap: 10px;
    `,
    bar: css`
      display: flex;
      align-items: center;
      gap: 3px;
      background: ${tokens.colors.dark[500]};
      border: none;
      border-radius: 6px;
      color: ${isLight ? tokens.colors.light[700] : tokens.colors.light[300]};
      font-size: 16px;
      font-weight: 300;
      padding: 4px 10px 4px 4px;
      width: 100%;
    `,
    endpoint: css`
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
      font-size: 14px;
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
