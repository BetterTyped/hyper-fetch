import clsx from "clsx";

import { tokens } from "frontend/theme/tokens";
import { createStyles, ExtractKeys } from "frontend/theme/use-styles.hook";

const styles = createStyles(({ css }) => {
  return {
    base: css`
      display: flex;
      align-items: center;
      border: 0px;
      border-radius: 4px;
      font-weight: 500;
    `,
  };
});

const sizeVariants = createStyles(({ css }) => {
  return {
    small: css`
      font-size: 12px;
      padding: 3px 6px;
    `,
    medium: css`
      font-size: 13px;
      padding: 3px 8px;
    `,
  };
});

const colorVariants = createStyles(({ isLight, css }) => {
  return {
    blue: css`
      color: ${isLight ? tokens.colors.blue[500] : "#00bbd4"};
      background: ${isLight ? tokens.colors.blue[300] + tokens.alpha[30] : tokens.colors.dark[300]};
    `,
    green: css`
      color: ${isLight ? tokens.colors.green[500] : "#4caf50"};
      background: ${isLight ? tokens.colors.green[300] + tokens.alpha[30] : tokens.colors.dark[300]};
    `,
    red: css`
      color: ${isLight ? tokens.colors.red[500] : "#f44336"};
      background: ${isLight ? tokens.colors.red[300] + tokens.alpha[30] : tokens.colors.dark[300]};
    `,
    gray: css`
      color: ${isLight ? "#8a94a6" : "#a0a9bb"};
      background: ${isLight ? tokens.colors.light[400] + tokens.alpha[30] : tokens.colors.dark[300]};
    `,
    orange: css`
      color: ${isLight ? tokens.colors.orange[500] : "#ff9800"};
      background: ${isLight ? tokens.colors.orange[300] + tokens.alpha[30] : tokens.colors.dark[300]};
    `,
    normal: css`
      color: ${isLight ? tokens.colors.dark[300] : "#ffffff"};
      background: ${isLight ? tokens.colors.dark[300] + tokens.alpha[10] : tokens.colors.dark[300]};
    `,
    inactive: css`
      color: ${isLight ? tokens.colors.light[300] : "#607d8b"};
      background: ${isLight ? tokens.colors.dark[300] + tokens.alpha[10] : tokens.colors.dark[300]};
    `,
  };
});

export const Chip = ({
  children,
  color = "green",
  size = "small",
  ...props
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: ExtractKeys<typeof colorVariants>;
  size?: ExtractKeys<typeof sizeVariants>;
}) => {
  const css = styles.useStyles();
  const cssColor = colorVariants.useStyles();
  const cssSize = sizeVariants.useStyles();

  if (!props.onClick) {
    return (
      <div {...(props as any)} className={clsx(css.base, cssSize[size], cssColor[color], props.className)}>
        {children}
      </div>
    );
  }

  return (
    <button type="button" {...props} className={clsx(css.base, cssSize[size], cssColor[color], props.className)}>
      {children}
    </button>
  );
};
