import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { createStyles } from "frontend/theme/use-styles.hook";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    tooltip: css`
      z-index: 50;
      overflow: hidden;
      border-radius: 0.25rem;
      border: 1px solid
        ${isLight ? tokens.colors.light[300] + tokens.alpha[50] : tokens.colors.dark[400] + tokens.alpha[50]};
      background: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[700]};
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[400]};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transform-origin: var(--radix-tooltip-transform-origin);
      animation: var(--radix-tooltip-animation);
    `,
  };
});

export const { Trigger, Arrow } = TooltipPrimitive;

export const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

export const Content = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const css = styles.useStyles();

  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={css.clsx(css.tooltip, className)}
      {...props}
    />
  );
});
Content.displayName = TooltipPrimitive.Content.displayName;
