import { ChevronRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { createStyles } from "theme/use-styles.hook";
import { tokens } from "theme/tokens";

const styles = createStyles(({ isLight, css }) => {
  return {
    button: css`
      display: flex;
      align-items: center;
      gap: 10px;
      background: transparent;
      border: 0;
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[100]};
      width: 100%;
      height: 30px;
      padding: 0 10px;
      background: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[700]};
      text-align: left;
      position: sticky;
      top: 0;
      z-index: 100;

      &:focus-within {
        outline-offset: -2px !important;
      }
      & svg {
        fill: ${isLight ? tokens.colors.light[600] : tokens.colors.light[300]};
        transition: 0.15s ease-out;
      }
    `,
    bottomBorder: css`
      border-bottom: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]}!important;
    `,
    wrapper: css`
      border-top: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
      &:last-child {
        border-bottom: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
      }
    `,
    content: css`
      overflow: hidden;
      transition: 0.15s ease-out;
      height: auto;

      & > div {
        border-bottom: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
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
    <div className={css.wrapper}>
      <button onClick={handleToggle} type="button" className={css.clsx(css.button, { [css.bottomBorder]: isExpanded })}>
        <ChevronRight
          style={{
            transform: `rotate(${!isExpanded ? -90 : 0}deg)`,
          }}
        />
        <span>{title}</span>
      </button>
      <div
        className={css.content}
        style={{
          maxHeight,
          visibility: isExpanded ? "visible" : "hidden",
        }}
      >
        <div ref={ref}>{children}</div>
      </div>
    </div>
  );
};
