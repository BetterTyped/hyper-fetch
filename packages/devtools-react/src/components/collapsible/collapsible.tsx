import { useLayoutEffect, useRef, useState } from "react";

export const Collapsible = ({
  title,
  children,
  initiallyExpanded = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const ref = useRef<HTMLDivElement>(null);

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
      <button
        onClick={handleToggle}
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(0, 0, 0, 0.1)",
          textAlign: "left",
          width: "100%",
          border: 0,
          borderTop: "1px solid rgb(61, 66, 74)",
          borderBottom: "1px solid rgb(61, 66, 74)",
          color: "#fff",
          height: "30px",
          padding: "0 10px",
          // hide border of stacked collapsibles
          marginBottom: "-1px",
        }}
      >
        <svg
          id="fi_8791171"
          enableBackground="new 0 0 58.026 58.026"
          viewBox="0 0 58.026 58.026"
          xmlns="http://www.w3.org/2000/svg"
          width="16px"
          style={{
            transform: !isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease-out",
          }}
        >
          <g>
            <path
              fill="rgb(180, 194, 204)"
              id="XMLID_467_"
              d="m29.013 46.019c-1.1 0-2.1-.4-2.9-1.2l-25-26c-1.5-1.6-1.5-4.1.1-5.7 1.6-1.5 4.1-1.5 5.7.1l22.1 23 22.1-23c1.5-1.6 4.1-1.6 5.7-.1s1.6 4.1.1 5.7l-25 26c-.8.8-1.8 1.2-2.9 1.2z"
            />
          </g>
        </svg>
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
