import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles((isLight, css) => {
  return {
    wrapper: css`
      display: flex;
      justify-content: space-between;
      gap: 10px;
      border-bottom: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
    `,
    heading: css`
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0px 0 0 6px;
      padding: 0 10px 0 4px;
      border-radius: 6px;
      gap: 8px;
      background: transparent;
      border: 0;
      outline-offset: -4px !important;
    `,
    title: css`
      color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[500]};
      font-size: 16px;
      font-weight: 500;
    `,
  };
});
