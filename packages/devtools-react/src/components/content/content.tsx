import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ css }) => {
  return {
    base: css`
      display: flex;
      position: relative;
      flex: 1 1 auto;
      height: 100%;
    `,
  };
});

export const Content = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => {
  const css = styles.useStyles();
  return (
    <div className={css.base} {...props}>
      {children}
    </div>
  );
};
