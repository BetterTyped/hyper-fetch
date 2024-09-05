import { Resizable, ResizableProps } from "re-resizable";

import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    sidebar: css`
      display: flex;
      flex-direction: column;
      background: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[600]};
      border-left: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      border-right: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      overflow: auto;
    `,
  };
});

export const Sidebar = ({ className, children, ...props }: ResizableProps) => {
  const css = styles.useStyles();
  return (
    <Resizable
      defaultSize={{
        width: "400px",
        height: "100%",
      }}
      minHeight="100%"
      maxHeight="100%"
      maxWidth="100%"
      {...props}
      className={css.clsx(css.sidebar, className)}
    >
      {children}
    </Resizable>
  );
};
