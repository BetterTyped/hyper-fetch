import clsx from "clsx";

import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    base: css`
      display: flex;
      gap: 8px;
      border: 0px;
      padding: 14px 14px 12px;
      font-size: 14px;
      font-weight: 500;

      & svg {
        width: 16px !important;
        height: 16px !important;
      }
    `,
    primary: css`
      background: transparent;
      border-bottom: 2px solid rgb(88 196 220);
      color: #fff;
    `,
    secondary: css`
      background: transparent;
      border-bottom: 2px solid transparent;
      color: #b4c2cc;
    `,
  };
});

export const Button = ({
  children,
  color = "primary",
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: "primary" | "secondary";
}) => {
  const css = styles.useStyles();

  return (
    <button type="button" {...props} className={clsx(css.base, css[color], props.className)}>
      {children}
    </button>
  );
};
