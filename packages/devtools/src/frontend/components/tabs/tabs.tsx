import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { createStyles } from "frontend/theme/use-styles.hook";

export const { Root } = TabsPrimitive;

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    list: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.4rem;
      background: ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      padding: 0.25rem;
      color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[500]};
    `,
    trigger: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      line-height: 1;
      font-weight: 500;
      border-radius: 0.4rem;
      transition: all 0.2s ease;
      outline-offset: 2px;
      outline: 2px solid transparent;
      color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[500]};
      background: transparent;
      border: 0px;

      &:focus-visible {
        outline-color: ${tokens.colors.cyan[300]};
        outline-offset: 2px;
      }

      &[data-state="active"] {
        background: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[600]};
        color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[500]};
      }

      &:disabled {
        pointer-events: none;
        opacity: 0.5;
      }
    `,
    content: css`
      margin-top: 0.5rem;
      outline-offset: 2px;
      outline: 2px solid transparent;
      transition: all 0.2s ease;

      &:focus-visible {
        outline-color: ${tokens.colors.cyan[300]};
      }
    `,
  };
});

export const List = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const css = styles.useStyles();

  return <TabsPrimitive.List ref={ref} className={css.clsx(css.list, className)} {...props} />;
});
List.displayName = TabsPrimitive.List.displayName;

export const Trigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const css = styles.useStyles();

  return <TabsPrimitive.Trigger ref={ref} className={css.clsx(css.trigger, className)} {...props} />;
});
Trigger.displayName = TabsPrimitive.Trigger.displayName;

export const Content = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => {
  const css = styles.useStyles();

  return <TabsPrimitive.Content ref={ref} className={css.clsx(css.content, className)} {...props} />;
});
Content.displayName = TabsPrimitive.Content.displayName;
