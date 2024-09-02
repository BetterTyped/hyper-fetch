import { SearchIcon } from "lucide-react";

import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ isLight, css }) => {
  return {
    wrapper: css`
      display: flex;
      gap: 2px;
      position: relative;
      align-items: center;
    `,
    input: css`
      background-color: ${isLight ? tokens.colors.light[300] : tokens.colors.dark[500]};
      font-size: 14px;
      color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[500]};
      padding: 2px 2px 2px 22px;
      outline: none;
      min-width: 80px;
      border-radius: 4px;
      border: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[300]};
      height: 26px;

      &::placeholder {
        color: ${isLight ? tokens.colors.light[700] : tokens.colors.light[500]};
      }

      &:focus-within {
        outline-offset: 2px;
        outline: 2px solid ${tokens.colors.cyan[300]};
      }
    `,
    icon: css`
      position: absolute;
      pointer-events: none;
      margin-left: 5px;
    `,
  };
});

export const Search = ({
  ...props
}: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) => {
  const css = styles.useStyles();
  return (
    <div className={css.wrapper}>
      <SearchIcon height="14px" width="14px" className={css.icon} />
      <input type="text" {...props} className={css.clsx(css.input, props.className)} />
    </div>
  );
};
