import { createStyles, ExtractKeys } from "theme/use-styles.hook";

export const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    card: css`
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 10px;
      border-radius: 8px;
      margin: 10px;
      width: 200px;
      background: transparent;
      color: ${isLight ? tokens.colors.light[700] : tokens.colors.light[400]};

      &:hover {
        background: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[500]}${tokens.alpha[30]};
      }
    `,
  };
});

const colorVariants = createStyles(({ css, isLight, tokens }) => {
  return {
    blue: css`
      border: 1px solid ${tokens.colors.blue[400]}${tokens.alpha[70]};
      box-shadow:
        0 3px 6px ${tokens.colors.blue[400]}${tokens.alpha[30]},
        0px 0px 6px ${tokens.colors.blue[400]}${tokens.alpha[40]};
    `,
    gray: css`
      border: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]}${tokens.alpha[70]};
      box-shadow:
        0 3px 6px ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]}${tokens.alpha[30]},
        0px 0px 6px ${isLight ? tokens.colors.light[500] : tokens.colors.dark[900]}${tokens.alpha[40]};
    `,
    teal: css`
      border: 1px solid ${tokens.colors.teal[400]}${tokens.alpha[70]};
      box-shadow:
        0 3px 6px ${tokens.colors.teal[400]}${tokens.alpha[30]},
        0px 0px 6px ${tokens.colors.teal[400]}${tokens.alpha[40]};
    `,
    cyan: css`
      border: 1px solid ${tokens.colors.cyan[400]}${tokens.alpha[70]};
      box-shadow:
        0 3px 6px ${tokens.colors.cyan[400]}${tokens.alpha[30]},
        0px 0px 6px ${tokens.colors.cyan[400]}${tokens.alpha[40]};
    `,
    pink: css`
      border: 1px solid ${tokens.colors.pink[400]}${tokens.alpha[70]};
      box-shadow:
        0 3px 6px ${tokens.colors.pink[400]}${tokens.alpha[30]},
        0px 0px 6px ${tokens.colors.pink[400]}${tokens.alpha[40]};
    `,
    orange: css`
      border: 1px solid ${isLight ? tokens.colors.orange[400] : tokens.colors.orange[500]}${tokens.alpha[70]};
      box-shadow:
        0 3px 6px ${isLight ? tokens.colors.orange[400] : tokens.colors.orange[500]}${tokens.alpha[30]},
        0px 0px 6px ${isLight ? tokens.colors.orange[400] : tokens.colors.orange[500]}${tokens.alpha[40]};
    `,
    red: css`
      border: 1px solid ${tokens.colors.red[400]}${tokens.alpha[70]};
      box-shadow:
        0 3px 6px ${tokens.colors.red[400]}${tokens.alpha[30]},
        0px 0px 6px ${tokens.colors.red[400]}${tokens.alpha[40]};
    `,
    green: css`
      border: 1px solid ${tokens.colors.green[400]}${tokens.alpha[70]};
      box-shadow:
        0 3px 6px ${tokens.colors.green[400]}${tokens.alpha[30]},
        0px 0px 6px ${tokens.colors.green[400]}${tokens.alpha[40]};
    `,
  };
});

const sizeVariants = createStyles(({ css }) => {
  return {
    small: css`
      gap: 4px;
      padding: 8px;
      font-size: 12px;
      border-radius: 6px;
    `,
    medium: css`
      gap: 5px;
      padding: 10px;
      font-size: 14px;
      border-radius: 8px;
    `,
    large: css`
      gap: 6px;
      padding: 12px;
      font-size: 16px;
      border-radius: 12px;
    `,
  };
});

export const CardButton = ({
  children,
  color = "gray",
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
    <button type="button" {...props} className={css.clsx(css.card, cssColor[color], cssSize[size], className)}>
      {children}
    </button>
  );
};
