import { useLayoutEffect, useRef, useState } from "react";

import { ChevronIcon } from "icons/chevron";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    base: css`
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(0, 0, 0, 0.1);
      text-align: left;
      width: 100%;
      border: 0;
      border-top: 1px solid rgb(61, 66, 74);
      border-bottom: 1px solid rgb(61, 66, 74);
      color: #fff;
      height: 30px;
      padding: 0 10px;
      margin-bottom: -1px;

      & svg {
        fill: rgb(180, 194, 204);
      }
    `,
  };
});

export const Collapsible = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const css = styles.useStyles();

  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  const [height, setHeight] = useState<number>(0);

  const handleToggle: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
    if (ref.current?.clientHeight) {
      setHeight(ref.current.clientHeight);
    }
  };

  useLayoutEffect(() => {
    if (ref.current?.clientHeight) {
      setHeight(ref.current.clientHeight);
      try {
        const resizeObserver = new ResizeObserver(() => {
          setHeight(ref.current!.clientHeight);
        });
        resizeObserver.observe(ref.current);
        return () => {
          resizeObserver.disconnect();
        };
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const maxHeight = isExpanded ? height : 0;

  return (
    <>
      <button onClick={handleToggle} type="button" className={css.base}>
        <ChevronIcon />
        <span>{title}</span>
      </button>
      <div
        style={{
          overflow: "hidden",
          transition: "0.15s ease-out",
          height: "auto",
          maxHeight,
        }}
      >
        <div ref={ref}>{children}</div>
      </div>
    </>
  );
};
