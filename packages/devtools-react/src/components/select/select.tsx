"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    trigger: css`
      display: flex;
      height: 26px;
      align-items: center;
      justify-content: space-between;
      border-radius: 4px;
      border: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      background-color: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[800]};
      color: ${isLight ? tokens.colors.light[900] : tokens.colors.light[50]};
      padding: 0.25rem 0.75rem;
      font-size: 0.875rem;

      &:focus {
        outline-offset: 2px;
        outline: 2px solid ${tokens.colors.cyan[300]};
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      & > span {
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
      }
    `,
    chevron: css`
      width: 1rem;
      height: 1rem;
      opacity: 0.5;
    `,
    scrollUpButton: css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0;
      cursor: default;
    `,
    scrollDownButton: css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0;
      cursor: default;
    `,
    content: css`
      position: relative;
      z-index: 9999999;
      max-height: 24rem;
      min-width: 8rem;
      overflow: hidden;
      border-radius: 0.375rem;
      border: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      background-color: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[800]};
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[100]};
      box-shadow: ${tokens.shadow.lg(isLight ? tokens.colors.light[400] : tokens.colors.dark[800])};
      animation-duration: 400ms;
    `,
    contentPopper: css`
      &[data-side="top"] {
        transform: translateY(-0.25rem);
      }
      &[data-side="left"] {
        transform: translateX(-0.25rem);
      }
      &[data-side="right"] {
        transform: translateX(0.25rem);
      }
      &[data-side="bottom"] {
        transform: translateY(0.25rem);
      }
    `,
    viewportContent: css`
      padding: 0.25rem;
    `,
    viewport: css`
      height: var(--radix-select-trigger-height);
      width: 100%;
      min-width: var(--radix-select-trigger-width);
    `,
    label: css`
      padding: 0.25rem 0.5rem;
      font-size: 13px;
      font-weight: 600;
      color: ${isLight ? tokens.colors.light[400] : tokens.colors.dark[50]};
    `,
    item: css`
      position: relative;
      display: flex;
      width: 100%;
      cursor: default;
      user-select: none;
      align-items: center;
      border-radius: 4px;
      padding: 0.25rem 0.5rem 0.25rem 1.5rem;
      font-size: 12px;
      outline: none;
      &:focus {
        background-color: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[400]};
      }
      &[data-disabled] {
        opacity: 0.5;
      }
    `,
    check: css`
      position: absolute;
      left: 0.4rem;
      display: flex;
      height: 0.75rem;
      width: 0.75rem;
      align-items: center;
      justify-content: center;
      margin-top: 5px;
    `,
    separator: css`
      margin: 0.25rem -0.25rem;
      background: ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
    `,
  };
});

export const { Root } = SelectPrimitive;
export const { Group } = SelectPrimitive;
export const { Value } = SelectPrimitive;

export const Trigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <SelectPrimitive.Trigger ref={ref} className={css.clsx(css.trigger, className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className={css.chevron} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
Trigger.displayName = SelectPrimitive.Trigger.displayName;

export const ScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <SelectPrimitive.ScrollUpButton ref={ref} className={css.clsx(css.scrollUpButton, className)} {...props}>
      <ChevronUp className={css.chevron} />
    </SelectPrimitive.ScrollUpButton>
  );
});
ScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

export const ScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <SelectPrimitive.ScrollDownButton ref={ref} className={css.clsx(css.scrollDownButton, className)} {...props}>
      <ChevronDown className={css.chevron} />
    </SelectPrimitive.ScrollDownButton>
  );
});
ScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

export const Content = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={css.clsx(css.content, position === "popper" && css.contentPopper, className)}
        position={position}
        {...props}
      >
        <ScrollUpButton />
        <SelectPrimitive.Viewport className={css.clsx(css.viewportContent, position === "popper" && css.viewport)}>
          {children}
        </SelectPrimitive.Viewport>
        <ScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
Content.displayName = SelectPrimitive.Content.displayName;

export const Label = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => {
  const css = styles.useStyles();
  return <SelectPrimitive.Label ref={ref} className={css.clsx(css.label, className)} {...props} />;
});
Label.displayName = SelectPrimitive.Label.displayName;

export const Item = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <SelectPrimitive.Item ref={ref} className={css.clsx(css.item, className)} {...props}>
      <span className={css.check}>
        <SelectPrimitive.ItemIndicator>
          <Check className={css.chevron} style={{ opacity: 1 }} />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
Item.displayName = SelectPrimitive.Item.displayName;

export const Separator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const css = styles.useStyles();
  return <SelectPrimitive.Separator ref={ref} className={css.clsx(css.separator, className)} {...props} />;
});
Separator.displayName = SelectPrimitive.Separator.displayName;
