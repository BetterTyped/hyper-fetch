import { tokens } from "theme/tokens";
import { createStyles, ExtractKeys } from "theme/use-styles.hook";

const styles = createStyles(({ css }) => {
  return {
    button: css`
      display: flex;
      align-items: center;
      gap: 5px;
      border: 0px;
      padding: 5px 10px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 4px;
      color: #fff !important;
      filter: grayscale(0);
      transition: background 0.15 ease-in-out;

      & svg {
        width: 16px;
        height: 16px;
        fill: #fff !important;
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

export const Button = ({
  children,
  color = "blue",
  className,
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: ExtractKeys<typeof colorVariants>;
}) => {
  const css = styles.useStyles();
  const cssColor = colorVariants.useStyles();
  return (
    <button type="button" {...props} className={css.clsx(css.button, cssColor[color], className)}>
      {children}
    </button>
  );
};
