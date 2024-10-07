import React from "react";
import { Atom, Boxes, CircleDotDashed } from "lucide-react";

import * as Tooltip from "components/tooltip/tooltip";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ css }) => {
  return {
    base: css`
      display: flex;
      align-items: center;
      gap: 4px;
      overflow: hidden;
      background-color: transparent;
      border: none;
      color: inherit;
      padding: 0;

      & svg {
        width: 20px;
        height: 20px;
      }
    `,
    text: css`
      display: block;
      max-width: 100%;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    `,
  };
});

const colorsVariants = createStyles(({ isLight, css, tokens }) => {
  return {
    queue: css`
      & svg {
        stroke: ${isLight ? tokens.colors.blue[300] : tokens.colors.blue[300]};
      }
    `,
    cache: css`
      & svg {
        stroke: ${isLight ? tokens.colors.orange[300] : tokens.colors.orange[300]};
      }
    `,
    abort: css`
      & svg {
        stroke: ${isLight ? tokens.colors.red[300] : tokens.colors.red[300]};
      }
    `,
  };
});

export type KeyTypes = "queue" | "cache" | "abort";

const getKeyIcon = (type: KeyTypes) => {
  switch (type) {
    case "queue":
      return <Atom />;
    case "cache":
      return <Boxes />;
    case "abort":
      return <CircleDotDashed />;
    default:
      return null;
  }
};

export const Key = ({
  value,
  type,
  className,
  ...props
}: React.HTMLProps<HTMLButtonElement> & { value: string; type: KeyTypes }) => {
  const css = styles.useStyles();
  const colorVariants = colorsVariants.useStyles();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger {...props} className={css.clsx(css.base, colorVariants[type], className)}>
        {getKeyIcon(type)}
        <span className={css.text}>{value}</span>
      </Tooltip.Trigger>
      <Tooltip.Content>This is {type}Key</Tooltip.Content>
    </Tooltip.Root>
  );
};
