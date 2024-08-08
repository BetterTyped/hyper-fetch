import clsx from "clsx";

import { createStyles, ExtractKeys } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    base: css`
      border: 0px;
      border-radius: 4px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 500;
    `,
    blue: css`
      color: #00bbd4;
      background: transparent;
      border: 1px solid rgb(61, 66, 74);
    `,
    green: css`
      color: #4caf50;
      background: transparent;
      border: 1px solid rgb(61, 66, 74);
    `,
    red: css`
      color: #f44336;
      background: transparent;
      border: 1px solid rgb(61, 66, 74);
    `,
    gray: css`
      color: #607d8b;
      background: transparent;
      border: 1px solid rgb(61, 66, 74);
    `,
    orange: css`
      color: #ff9800;
      background: transparent;
      border: 1px solid rgb(61, 66, 74);
    `,
    inactive: css`
      color: #475055;
      background: transparent;
      border: 1px solid rgb(61, 66, 74);
    `,
  };
});

export const Chip = ({
  children,
  color = "green",
  ...props
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: Exclude<ExtractKeys<typeof styles>, "base">;
}) => {
  const css = styles.useStyles();
  return (
    <button type="button" {...props} className={clsx(css.base, css[color], props.className)}>
      {children}
    </button>
  );
};
