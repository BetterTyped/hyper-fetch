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
    cardContent: css`
      font-size: "12px";
      font-weight: 500;
      max-width: "200px";
    `,
    cardFooter: css``,
  };
});
