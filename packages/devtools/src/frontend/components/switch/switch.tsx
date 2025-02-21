import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { createStyles } from "frontend/theme/use-styles.hook";

const styles = createStyles(({ isLight, css }) => {
  return {
    switch: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 1.5rem;
      border-radius: 1.25rem;
      border: 2px solid transparent;
      transition-property: background-color, border-color;
      transition-duration: 150ms;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      outline-offset: 2px;
      outline: 2px solid transparent;
      background-color: ${isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)"};
      &:focus-visible {
        outline-color: ${isLight ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)"};
      }
      &[data-state="checked"] {
        background-color: ${isLight ? "rgb(14, 165, 233)" : "rgb(76, 154, 255)"};
      }
      &[data-state="unchecked"] {
        background-color: ${isLight ? "rgb(224, 224, 224)" : "rgb(55, 65, 81)"};
      }
      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `,
    thumb: css`
      display: block;
      width: 1.25rem;
      height: 1.25rem;
      background-color: ${isLight ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)"};
      border-radius: 50%;
      transform: translateX(0);
      transition-property: transform;
      transition-duration: 150ms;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      &[data-state="checked"] {
        transform: translateX(1.25rem);
      }
    `,
  };
});

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <SwitchPrimitives.Root className={css.clsx(css.switch, className)} {...props} ref={ref}>
      <SwitchPrimitives.Thumb className={css.clsx(css.thumb, className)} />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;
