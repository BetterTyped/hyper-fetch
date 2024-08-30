import { AppWindow } from "lucide-react";

import { Toolbar } from "components/toolbar/toolbar";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    sidebar: css`
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[600]};
      border-right: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      overflow: auto;
    `,
    appIcon: css`
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      background: ${isLight ? tokens.colors.light[400] : tokens.colors.dark[500]};
      & > * {
        width: 100%;
        height: 100%;
      }
    `,
    row: css`
      display: flex;
      align-items: center;
      gap: 10px;
    `,
  };
});

export const Sidebar = ({ className, children, ...props }: React.HTMLProps<HTMLDivElement>) => {
  const css = styles.useStyles();
  return (
    <div {...props} className={css.clsx(css.sidebar, className)}>
      <Toolbar>
        <div className={css.row}>
          <div className={css.appIcon}>
            <AppWindow style={{ padding: "5px" }} />
          </div>
          <strong>Client #1</strong>
        </div>
      </Toolbar>
      {children}
    </div>
  );
};
