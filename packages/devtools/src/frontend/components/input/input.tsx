import * as React from "react";

import { createStyles } from "frontend/theme/use-styles.hook";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    input: css`
      flex: 1;
      height: 2.5rem;
      border-radius: 0.5rem;
      border: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      background-color: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[600]};
      padding: 0.5rem 1rem;
      font-size: 1rem;
      color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[500]};
      outline-offset: 2px;
      transition-property: background-color, border-color, box-shadow;
      transition-duration: 150ms;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

      &::placeholder {
        color: ${isLight ? tokens.colors.light[700] : tokens.colors.light[500]};
      }

      &:focus-visible {
        outline: 2px solid ${tokens.colors.cyan[300]};
        outline-offset: 2px;
        background-color: ${isLight ? tokens.colors.light[100] : tokens.colors.dark[700]};
        border-color: ${tokens.colors.cyan[300]};
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `,
  };
});

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const css = styles.useStyles();

  return <input type={type} className={css.clsx(css.input, className)} ref={ref} {...props} />;
});
Input.displayName = "Input";
