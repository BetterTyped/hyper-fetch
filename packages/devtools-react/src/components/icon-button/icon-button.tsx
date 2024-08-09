import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    base: css`
      display: flex;
      justify-content: center;
      align-items: center;
      border: 0px;
      border-radius: 100%;
      padding: 6px;
      width: 28px;
      height: 28px;
      background: transparent;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      & svg {
        width: 18px !important;
        height: 18px !important;
      }
    `,
  };
});

export const IconButton = ({
  children,
  className,
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
  const css = styles.useStyles();

  return (
    <button type="button" {...props} className={styles.clsx(css.base, className)}>
      {children}
    </button>
  );
};
