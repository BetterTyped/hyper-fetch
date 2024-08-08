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
  initiallyExpanded = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const css = styles.useStyles();

  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const [height, setHeight] = useState<number>(0);

  const handleToggle: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
    if (ref.current?.clientHeight) {
      setHeight(ref.current.clientHeight);
    }
  };

  const heightValue = height ? `${height}px` : "auto";
  const currentHeight = isExpanded ? heightValue : 0;

  useLayoutEffect(() => {
    if (ref.current?.clientHeight) {
      setHeight(ref.current.clientHeight);
    }
  }, []);

  return (
    <>
      <button onClick={handleToggle} type="button" className={css.base}>
        <ChevronIcon />
        <span>{title}</span>
      </button>
      <div
        style={{
          overflow: "hidden",
          transition: "height 0.15s ease-out",
          height: currentHeight,
        }}
      >
        <div ref={ref}>{children}</div>
      </div>
    </>
  );
};
