import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { createStyles } from "theme/use-styles.hook";
import { tokens } from "theme/tokens";

const styles = createStyles((isLight, css) => {
  return {
    content: css`
      z-index: ${tokens.zIndex[99999]};
      min-width: 12rem;
      overflow: hidden;
      border-radius: 0.375rem;
      border: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
      background-color: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[800]};
      padding: 4px;
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[100]};
      box-shadow: ${tokens.shadow.lg(isLight ? tokens.colors.light[400] : tokens.colors.dark[800])};
      animation-duration: 400ms;
    `,
    trigger: css`
      font-size: 12px;
      line-height: 1;
      border-radius: 2px;
      display: flex;
      align-items: center;
      padding: 6px 8px;
      position: relative;
      user-select: none;
      outline: none;
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[400]};

      &:focus {
        background-color: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[400]};
      }
    `,
    inset: css`
      padding-left: 32px;
    `,
    item: css`
      position: relative;
      display: flex;
      align-items: center;
      cursor: default;
      padding: 6px 8px;
      border-radius: 2px;
      font-size: 12px;
      line-height: 1;
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[400]};

      &:focus {
        background-color: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[400]};
      }

      &[data-disabled] {
        opacity: 0.5;
        pointer-events: none;
      }
    `,
    itemSelect: css`
      padding-left: 2rem !important;
    `,
    icon: css`
      position: absolute;
      left: 8px;
      display: flex;
      height: 14px;
      width: 14px;
      align-items: center;
      justify-content: center;

      & div {
        height: 14px;
        width: 14px;
      }
    `,
    check: css`
      height: 16px;
      width: 16px;
    `,
    radio: css`
      height: 6px;
      width: 6px;
      fill: ${tokens.colors.cyan[400]};
      stroke: ${tokens.colors.cyan[400]};
    `,
    chevron: css`
      margin-left: auto;
      height: 16px;
      width: 16px;
    `,
    label: css`
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      line-height: 1;

      & svg {
        height: 14px;
        width: 14px;
      }
    `,
    separator: css`
      background-color: ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
      margin: 4px -4px;
      height: 1px;
    `,
    shortcut: css`
      margin-left: auto;
      font-size: 12px;
      opacity: 0.6;
      letter-spacing: 0.1em;
      padding-left: 10px;

      & svg {
        height: 12px;
        width: 12px;
      }
    `,
  };
});

export const { Root } = DropdownMenuPrimitive;
export const { Trigger } = DropdownMenuPrimitive;
export const { Group } = DropdownMenuPrimitive;
export const { Portal } = DropdownMenuPrimitive;
export const { Sub } = DropdownMenuPrimitive;
export const { RadioGroup } = DropdownMenuPrimitive;

export const SubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={styles.clsx(css.trigger, inset && css.inset, className)}
      {...props}
    >
      {children}
      <ChevronRight className={css.chevron} />
    </DropdownMenuPrimitive.SubTrigger>
  );
});
SubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

export const SubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        ref={ref}
        className={styles.clsx(css.content, className)}
        sideOffset={2}
        alignOffset={-5}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
SubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

export const Content = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const css = styles.useStyles();

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={styles.clsx(css.content, className)}
        onClick={(event) => event.stopPropagation()}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
Content.displayName = DropdownMenuPrimitive.Content.displayName;

export const Item = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <DropdownMenuPrimitive.Item ref={ref} className={styles.clsx(css.item, inset && css.inset, className)} {...props} />
  );
});
Item.displayName = DropdownMenuPrimitive.Item.displayName;

export const CheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={styles.clsx(css.item, css.itemSelect, className)}
      checked={checked}
      {...props}
    >
      <span className={css.icon}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className={css.check} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});
CheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

export const RadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <DropdownMenuPrimitive.RadioItem ref={ref} className={styles.clsx(css.item, css.itemSelect, className)} {...props}>
      <span className={css.icon}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className={css.radio} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});
RadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

export const Label = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => {
  const css = styles.useStyles();
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={styles.clsx(css.label, inset && css.inset, className)}
      {...props}
    />
  );
});
Label.displayName = DropdownMenuPrimitive.Label.displayName;

export const Separator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const css = styles.useStyles();
  return <DropdownMenuPrimitive.Separator ref={ref} className={styles.clsx(css.separator, className)} {...props} />;
});
Separator.displayName = DropdownMenuPrimitive.Separator.displayName;

export const Shortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  const css = styles.useStyles();
  return <span className={styles.clsx(css.shortcut, className)} {...props} />;
};
Shortcut.displayName = "DropdownMenuShortcut";
