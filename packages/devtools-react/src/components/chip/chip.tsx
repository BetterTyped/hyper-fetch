import clsx from "clsx";

import { createStyles, ExtractKeys } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    base: css`
      border: 0px;
      border-radius: 4px;
      font-weight: 500;
      background: #414962;
    `,
    small: css`
      font-size: 12px;
      padding: 2px 6px;
    `,
    medium: css`
      font-size: 14px;
      padding: 3px 8px;
    `,
    blue: css`
      color: #00bbd4;
    `,
    green: css`
      color: #4caf50;
    `,
    red: css`
      color: #f44336;
    `,
    gray: css`
      color: #e3e3e3;
    `,
    orange: css`
      color: #ff9800;
    `,
    inactive: css`
      color: #607d8b;
    `,
  };
});

export const Chip = ({
  children,
  color = "green",
  size = "medium",
  ...props
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: Exclude<ExtractKeys<typeof styles>, "base" | "small" | "medium">;
  size?: "small" | "medium";
}) => {
  const css = styles.useStyles();
  return (
    <button type="button" {...props} className={clsx(css.base, css[size], css[color], props.className)}>
      {children}
    </button>
  );
};
