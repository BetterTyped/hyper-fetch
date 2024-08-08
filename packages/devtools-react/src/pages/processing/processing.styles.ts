import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles((theme, css) => {
  return {
    wrapper: css`
      overflow-y: auto;
    `,
    card: css`
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 10px;
      border-radius: 8px;
      margin: 10px;
      min-width: 180px;
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
    `,
    cardFooter: css`
      margin-top: 10px;
      font-size: 12px;
      font-weight: 500;
      max-width: 200px;
    `,
  };
});
