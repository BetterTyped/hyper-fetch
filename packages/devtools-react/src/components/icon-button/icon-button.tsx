import React from "react";

import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ isLight, css }) => {
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
      transition: background 0.2s ease;

      &:hover {
        background: ${isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)"};
      }

      & svg {
        width: 18px !important;
        height: 18px !important;
      }

      &:focus-within {
        outline-offset: 0px !important;
      }
    `,
  };
});

export const IconButton = React.forwardRef(
  (
    {
      children,
      className,
      ...props
    }: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) => {
    const css = styles.useStyles();

    return (
      <button {...props} ref={ref} type="button" className={css.clsx(css.base, className)}>
        {children}
      </button>
    );
  },
);
