import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    tooltip: css`
      z-index: 50;
      overflow: hidden;
      border-radius: 0.375rem;
      border: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      background: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[700]};
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[400]};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transform-origin: var(--radix-tooltip-transform-origin);
      animation: var(--radix-tooltip-animation);
    `,
  };
});

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = TooltipPrimitive.Root;

export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
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
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
