import clsx from "clsx";

import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((isLight, css) => {
  return {
    base: css`
      display: flex;
      gap: 8px;
      border: 0px;
      padding: 14px 14px 12px;
      font-size: 14px;
      font-weight: 500;
      background: transparent;

      & svg {
        width: 16px !important;
        height: 16px !important;
      }

      &:hover {
        background: ${isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.1)"};
      }

      &:focus-within {
        border-radius: 4px;
        outline-offset: -2px !important;
      }
    `,

    small: css`
      font-size: 0px !important;
      padding-right: 8px;
    `,

    primary: css`
      border-bottom: 2px solid ${tokens.colors.cyan[300]}!important;
      color: ${isLight ? tokens.colors.dark[300] : tokens.colors.light[50]};

      & svg {
        fill: ${isLight ? tokens.colors.cyan[300] : tokens.colors.cyan[300]}!important;
      }
    `,
    secondary: css`
      border-bottom: 2px solid transparent !important;
      color: ${isLight ? tokens.colors.light[700] : tokens.colors.light[500]};
    `,
  };
});

export const Button = ({
  children,
  color = "primary",
  small = true,
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: "primary" | "secondary";
  small?: boolean;
}) => {
  const css = styles.useStyles();

  return (
    <button type="button" {...props} className={clsx(css.base, css[color], props.className, { [css.small]: small })}>
      {children}
    </button>
  );
};
