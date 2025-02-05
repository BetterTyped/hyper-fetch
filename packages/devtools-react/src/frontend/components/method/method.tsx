import { HttpMethods } from "@hyper-fetch/core";

import { createStyles } from "frontend/theme/use-styles.hook";

const styles = createStyles(({ css }) => {
  return {
    base: css`
      text-transform: uppercase;
      font-weight: 600;
      font-size: 10px;
    `,
  };
});

const colorStyles = createStyles(({ css, tokens }) => {
  return {
    default: css`
      color: ${tokens.colors.cyan[400]};
    `,
    [HttpMethods.GET]: css`
      color: ${tokens.colors.green[400]};
    `,
    [HttpMethods.POST]: css`
      color: ${tokens.colors.yellow[400]};
    `,
    [HttpMethods.PATCH]: css`
      color: ${tokens.colors.purple[400]};
    `,
    [HttpMethods.PUT]: css`
      color: ${tokens.colors.pink[400]};
    `,
    [HttpMethods.DELETE]: css`
      color: ${tokens.colors.red[400]};
    `,
  };
});

export const Method = ({ method, ...props }: React.HTMLProps<HTMLDivElement> & { method: string }) => {
  const css = styles.useStyles();
  const colors = colorStyles.useStyles();
  const color = colors[method as keyof typeof colors] || colors.default;
  return (
    <span {...props} className={css.clsx(color, css.base)}>
      {method}
    </span>
  );
};
