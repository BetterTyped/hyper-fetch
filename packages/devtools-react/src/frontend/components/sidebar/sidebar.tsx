import { Resizable, ResizableProps } from "re-resizable";

import { createStyles } from "frontend/theme/use-styles.hook";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    sidebar: css`
      display: flex;
      flex-direction: column;
      background: ${isLight ? tokens.colors.light[50] : tokens.colors.dark[600]};
      border-left: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      border-right: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      overflow-y: hidden;
    `,
    handle: css`
      z-index: 100;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;

      &:hover {
        opacity: 1;
      }
      &:active {
        opacity: 1;
      }
      &:focus {
        opacity: 1;
      }
    `,
    top: css`
      position: absolute;
      width: 100%;
    `,
    left: css`
      position: absolute;
      height: 100%;
    `,
    right: css`
      position: absolute;
      height: 100%;
    `,
    bottom: css`
      position: absolute;
      width: 100%;
    `,
  };
});

// They are always on the opposite side
const borderStyles = createStyles(({ isLight, css, tokens }) => {
  return {
    base: css`
      position: absolute;
      z-index: 100;
      box-shadow: 0 0 6px 0.5px ${isLight ? tokens.colors.cyan[300] : tokens.colors.cyan[400]};
    `,
    top: css`
      height: 1px;
      width: 100%;
      border-bottom: 1px solid ${isLight ? tokens.colors.cyan[300] : tokens.colors.cyan[400]};
      margin-bottom: 5px;
    `,
    left: css`
      height: 100%;
      width: 1px;
      border-right: 1px solid ${isLight ? tokens.colors.cyan[300] : tokens.colors.cyan[400]};
      margin-right: 5px;
    `,
    right: css`
      height: 100%;
      width: 1px;
      border-left: 1px solid ${isLight ? tokens.colors.cyan[300] : tokens.colors.cyan[400]};
      margin-left: 5px;
    `,
    bottom: css`
      height: 1px;
      width: 100%;
      border-top: 1px solid ${isLight ? tokens.colors.cyan[300] : tokens.colors.cyan[400]};
      margin-top: 5px;
    `,
  };
});

const BorderHandle = ({ position }: { position: "top" | "left" | "right" | "bottom" }) => {
  const css = borderStyles.useStyles();

  return <div className={css.clsx(css.base, css[position])} />;
};

const getOpositePosition = (position: "top" | "left" | "right" | "bottom") => {
  if (position === "top") return "bottom";
  if (position === "left") return "right";
  if (position === "right") return "left";
  return "top";
};

export const Sidebar = ({
  className,
  position,
  children,
  ...props
}: ResizableProps & { position: "top" | "left" | "right" | "bottom" }) => {
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
      handleComponent={{
        [getOpositePosition(position)]: <BorderHandle position={position} />,
      }}
      handleClasses={{ [getOpositePosition(position)]: css.handle }}
      handleWrapperClass={css[position]}
    >
      {children}
    </Resizable>
  );
};
