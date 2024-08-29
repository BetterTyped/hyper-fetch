import { Resizable } from "re-resizable";
import { useEffect } from "react";

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
        stroke: ${isLight ? tokens.colors.light[700] : tokens.colors.light[500]};
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
    Top: css`
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: auto !important;
    `,
    Left: css`
      top: 0 !important;
      left: 0 !important;
      right: auto !important;
      bottom: 0 !important;
    `,
    Right: css`
      top: 0 !important;
      left: auto !important;
      right: 0 !important;
      bottom: 0 !important;
    `,
    Bottom: css`
      top: auto !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
    `,
  };
});

const sizes = {
  Top: {
    width: "100%",
    height: "400px",
  },
  Left: {
    width: "700px",
    height: "100%",
  },
  Right: {
    width: "700px",
    height: "100%",
  },
  Bottom: {
    width: "100%",
    height: "400px",
  },
};

const minSizes = {
  Top: {
    width: "100vw",
    height: "100px",
  },
  Left: {
    width: "300px",
    height: "100vh",
  },
  Right: {
    width: "300px",
    height: "100vh",
  },
  Bottom: {
    width: "100vw",
    height: "100px",
  },
};

export const DevtoolsWrapper = ({ children }: { children: React.ReactNode }) => {
  const css = styles.useStyles();
  const { position, size, setSize } = useDevtoolsContext("DevtoolsWrapper");

  const positionStyle = positionStyles.useStyles();

  useEffect(() => {
    setSize(sizes[position]);
  }, [position, setSize]);

  return (
    <Resizable
      size={size}
      onResize={(e, direction, ref) => {
        const { width, height } = ref.getBoundingClientRect();
        setSize(() => ({
          width,
          height,
        }));
      }}
      // eslint-disable-next-line max-params
      onResizeStop={(e, direction, ref) => {
        const { width, height } = ref.getBoundingClientRect();
        setSize(() => ({
          width,
          height,
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
