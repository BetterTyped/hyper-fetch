import { useLayoutEffect, useRef, useState } from "react";

import { createStyles } from "frontend/theme/use-styles.hook";
import { Menu, Positions } from "./menu/menu";
import { Resizable } from "./resizable/resizable";
import { useDevtoolsContext } from "frontend/pages/_root/devtools.context";
import { AppProvider } from "./app.context";
import { Header } from "./header/header";

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

const radiusStyles = createStyles(({ css }) => {
  return {
    [Positions.Top]: css`
      border-radius: 0 0 10px 10px;
    `,
    [Positions.Left]: css`
      border-radius: 0 10px 10px 0;
    `,
    [Positions.Right]: css`
      border-radius: 10px 0 0 10px;
    `,
    [Positions.Bottom]: css`
      border-radius: 10px 10px 0 0;
    `,
  };
});

export const Application = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => {
  const ref = useRef<HTMLDivElement>(null);
  const css = styles.useStyles();
  const cssRadius = radiusStyles.useStyles();
  const [height, setHeight] = useState(0);
  const [width, setWeight] = useState(0);

  const { position, isStandalone } = useDevtoolsContext("DevtoolsApplication");

  const borderRadiusClass = cssRadius[position];

  const handleResize = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setHeight(rect.height);
      setWeight(rect.width);
    }
  };

  useLayoutEffect(() => {
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <AppProvider height={height} width={width}>
      <Resizable
        {...props}
        className={css.clsx(css.base, { [css.full]: isStandalone, [borderRadiusClass]: !isStandalone })}
        isStandalone={isStandalone}
      >
        <Header />
        <div ref={ref} className={css.content}>
          <Menu height={height} />
          {children}
        </div>
      </Resizable>
    </AppProvider>
  );
};
