import { useEffect } from "react";
import { Resizable as ResizableComponent } from "re-resizable";

import { useDevtoolsContext } from "devtools.context";
import { createStyles } from "theme/use-styles.hook";
import { minSizes, sizes } from "./resizable.constants";

const positionStyles = createStyles(({ css }) => {
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

export const Resizable = ({
  children,
  className,
  isStandalone,
  ...props
}: React.HTMLProps<HTMLDivElement> & { isStandalone: boolean }) => {
  const { position, size, setSize } = useDevtoolsContext("DevtoolsWrapper");

  const positionStyle = positionStyles.useStyles();

  useEffect(() => {
    setSize(sizes[position]);
  }, [position, setSize]);

  if (isStandalone) {
    return (
      <div {...props} className={className}>
        {children}
      </div>
    );
  }

  return (
    <ResizableComponent
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
      className={positionStyles.clsx(className, positionStyle[position])}
      style={{
        position: "fixed",
        overflowX: "hidden",
      }}
    >
      {children}
    </ResizableComponent>
  );
};
