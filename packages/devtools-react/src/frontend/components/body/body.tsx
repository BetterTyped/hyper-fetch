import { createStyles } from "frontend/theme/use-styles.hook";

const styles = createStyles(({ css }) => {
  return {
    base: css`
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      position: relative;
    `,
  };
});

export const Body = ({ children, className, ...props }: React.HTMLProps<HTMLDivElement>) => {
  const css = styles.useStyles();
  return (
    <div {...props} className={css.clsx(css.base, className)}>
      {children}
    </div>
  );
};
