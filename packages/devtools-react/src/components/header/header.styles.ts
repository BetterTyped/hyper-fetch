import { createStyles } from "theme/use-styles.hook";

export const styles = createStyles((theme, css) => {
  return {
    wrapper: css`
      display: flex;
      justify-content: space-between;
      gap: 10px;
      border-bottom: 1px solid #3d424a;
    `,
    heading: css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0px 0 0 10px;
      gap: 8px;
    `,
    title: css`
      color: white;
      font-size: 16px;
      font-weight: 500;
    `,
  };
});
