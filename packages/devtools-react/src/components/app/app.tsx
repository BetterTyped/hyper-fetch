import { createStyles } from "theme/use-styles.hook";
import { Menu } from "./menu/menu";
import { Header } from "./header/header";
import { Resizable } from "./resizable/resizable";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    base: css`
      display: flex;
      flex-direction: column;
      position: fixed;
      z-index: 9999;
      overflow-y: hidden;
      background: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[600]};
      border: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      border-radius: 10px 10px 0 0;
      color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[500]};

      & * {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif !important;
      }

      & button:focus-within {
        outline-offset: 2px;
        outline: 2px solid ${tokens.colors.cyan[300]};
      }
    `,
    full: css`
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 0;
    `,
    content: css`
      display: flex;
      flex: 1;
      overflow-y: auto;
    `,
  };
});

export const Application = ({
  children,
  isStandalone = false,
  ...props
}: React.HTMLProps<HTMLDivElement> & { isStandalone?: boolean }) => {
  const css = styles.useStyles();

  return (
    <Resizable {...props} className={css.clsx(css.base, css.full)} isStandalone={isStandalone}>
      <Header />
      <div className={css.content}>
        <Menu />
        {children}
      </div>
    </Resizable>
  );
};
