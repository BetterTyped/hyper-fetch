import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    base: css`
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      border-bottom: 1px solid #3d424a;
      background: rgba(0, 0, 0, 0.1);
      padding: 4px 10px;
    `,
  };
});

export const Toolbar = ({ children, className, ...props }: React.HTMLProps<HTMLDivElement>) => {
  const css = styles.useStyles();

  return (
    <div {...props} className={styles.clsx(css.base, className)}>
      {children}
    </div>
  );
};
