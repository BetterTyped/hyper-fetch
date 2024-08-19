import { Resizable, Size } from "re-resizable";
import { useEffect, useState } from "react";

import { useDevtoolsContext } from "devtools.context";
import { createStyles } from "theme/use-styles.hook";
import { tokens } from "theme/tokens";

const styles = createStyles((isLight, css) => {
  return {
    wrapper: css`
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
      & svg {
        fill: ${isLight ? tokens.colors.light[700] : tokens.colors.light[500]};
      }
      & button:focus-within {
        outline-offset: 2px;
        outline: 2px solid ${tokens.colors.cyan[300]};
      }
    `,
  };
});

const positionStyles = createStyles((theme, css) => {
  return {
    top: css`
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: auto !important;
    `,
    left: css`
      top: 0 !important;
      left: 0 !important;
      right: auto !important;
      bottom: 0 !important;
    `,
    right: css`
      top: 0 !important;
      left: auto !important;
      right: 0 !important;
      bottom: 0 !important;
    `,
    bottom: css`
      top: auto !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
    `,
  };
});

const sizes = {
  top: {
    width: "100%",
    height: "400px",
  },
  left: {
    width: "700px",
    height: "100%",
  },
  right: {
    width: "700px",
    height: "100%",
  },
  bottom: {
    width: "100%",
    height: "400px",
  },
};

const minSizes = {
  top: {
    width: "100vw",
    height: "100px",
  },
  left: {
    width: "300px",
    height: "100vh",
  },
  right: {
    width: "300px",
    height: "100vh",
  },
  bottom: {
    width: "100vw",
    height: "100px",
  },
};

export const DevtoolsWrapper = ({ children }: { children: React.ReactNode }) => {
  const css = styles.useStyles();
  const { position } = useDevtoolsContext("DevtoolsWrapper");

  const positionStyle = positionStyles.useStyles();

  const [size, setSize] = useState<Size>(sizes[position]);

  useEffect(() => {
    setSize(sizes[position]);
  }, [position]);

  return (
    <Resizable
      size={size}
      // eslint-disable-next-line max-params
      onResizeStop={(e, direction, ref, d) => {
        setSize((prev) => ({
          width: Number(prev.width) + d.width,
          height: Number(prev.height) + d.height,
        }));
      }}
      defaultSize={sizes[position]}
      minHeight={minSizes[position].height}
      minWidth={minSizes[position].width}
      maxHeight="100vh"
      maxWidth="100vw"
      className={styles.clsx(css.wrapper, positionStyle[position])}
      style={{
        position: "fixed",
        overflowX: "hidden",
      }}
    >
      {children}
    </Resizable>
  );
};
