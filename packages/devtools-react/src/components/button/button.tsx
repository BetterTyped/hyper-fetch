import { tokens } from "theme/tokens";
import { createStyles, ExtractKeys } from "theme/use-styles.hook";

const styles = createStyles(({ css }) => {
  return {
    button: css`
      display: flex;
      align-items: center;
      border: 0px;
      color: #fff !important;
      font-weight: 500;
      filter: grayscale(0);
      transition: background 0.15 ease-in-out;

      & svg {
        stroke: #fff !important;
        margin-left: -2px;
      }

      &:disabled {
        filter: grayscale(1);
      }
    `,
  };
});

const colorVariants = createStyles(({ css }) => {
  return {
    blue: css`
      background: ${tokens.colors.blue[500]};
      &:hover {
        background: ${tokens.colors.blue[700]};
      }
      &:active {
        background: ${tokens.colors.blue[900]};
      }
    `,
    gray: css`
      background: ${tokens.colors.light[700]};
      &:hover {
        background: ${tokens.colors.light[800]};
      }
      &:active {
        background: ${tokens.colors.light[900]};
      }
    `,
    teal: css`
      background: ${tokens.colors.teal[500]};
      &:hover {
        background: ${tokens.colors.teal[700]};
      }
      &:active {
        background: ${tokens.colors.teal[900]};
      }
    `,
    cyan: css`
      background: ${tokens.colors.cyan[500]};
      &:hover {
        background: ${tokens.colors.cyan[700]};
      }
      &:active {
        background: ${tokens.colors.cyan[900]};
      }
    `,
    pink: css`
      background: ${tokens.colors.pink[500]};
      &:hover {
        background: ${tokens.colors.pink[700]};
      }
      &:active {
        background: ${tokens.colors.pink[900]};
      }
    `,
    orange: css`
      background: ${tokens.colors.orange[500]};
      &:hover {
        background: ${tokens.colors.orange[700]};
      }
      &:active {
        background: ${tokens.colors.orange[900]};
      }
    `,
    red: css`
      background: ${tokens.colors.red[500]};
      &:hover {
        background: ${tokens.colors.red[700]};
      }
      &:active {
        background: ${tokens.colors.red[900]};
      }
    `,
    green: css`
      background: ${tokens.colors.green[500]};
      &:hover {
        background: ${tokens.colors.green[700]};
      }
      &:active {
        background: ${tokens.colors.green[900]};
      }
    `,
  };
});

const sizeVariants = createStyles(({ css }) => {
  return {
    small: css`
      gap: 4px;
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 3px;
      & svg {
        width: 14px;
        height: 14px;
      }
    `,
    medium: css`
      gap: 5px;
      padding: 5px 10px;
      font-size: 14px;
      border-radius: 4px;
      & svg {
        width: 16px;
        height: 16px;
      }
    `,
    large: css`
      gap: 6px;
      padding: 6px 12px;
      font-size: 16px;
      border-radius: 5px;
      & svg {
        width: 18px;
        height: 18px;
      }
    `,
  };
});

export const Button = ({
  children,
  color = "cyan",
  size = "medium",
  className,
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: ExtractKeys<typeof colorVariants>;
  size?: ExtractKeys<typeof sizeVariants>;
}) => {
  const css = styles.useStyles();
  const cssColor = colorVariants.useStyles();
  const cssSize = sizeVariants.useStyles();

  return (
    <button type="button" {...props} className={css.clsx(css.button, cssColor[color], cssSize[size], className)}>
      {children}
    </button>
  );
};
