import { StylesFactory } from "theme/use-styles.hook";

export const styles: StylesFactory = (theme, css) => {
  return {
    wrapper: css`
      overflow-y: auto;
    `,
  };
};
