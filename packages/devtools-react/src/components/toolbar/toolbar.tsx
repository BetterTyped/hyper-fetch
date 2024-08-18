import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((isLight, css) => {
  return {
    base: css`
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      border-bottom: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
      background: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[700]};
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
