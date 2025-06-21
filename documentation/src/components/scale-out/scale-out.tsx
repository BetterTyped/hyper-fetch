import React from "react";
import { useActors, useMakeup, Stage, StyleOptions } from "@react-theater/scroll";

const ScaleOutContent = ({
  children,
  start = 0.01,
  end = 0.55,
  scale = 1,
  setActorStyle,
}: {
  children: React.ReactNode;
  start?: number;
  end?: number;
  scale?: number;
  setActorStyle: (style: StyleOptions) => void;
}) => {
  // Change
  useActors([
    {
      start: 0,
      end: start,
      screen: true,
      onUpdate: () => {
        setActorStyle({
          opacity: 0,
          scale: 0.4,
        });
      },
    },
    {
      start,
      end,
      screen: true,
      onUpdate: ({ progress }) => {
        setActorStyle({
          opacity: progress,
          scale: 0.4 + (scale - 0.4) * progress,
        });
      },
    },
  ]);

  return children;
};

export const ScaleOut = ({
  children,
  start,
  end,
  scale,
  className,
  isStage = true,
  ...rest
}: {
  children: React.ReactNode;
  start?: number;
  end?: number;
  scale?: number;
  isStage?: boolean;
} & React.HTMLProps<HTMLDivElement>) => {
  const [actorRef, setActorStyle] = useMakeup();
  const Component = isStage ? Stage : "div";

  return (
    <Component {...rest} ref={actorRef} className={`${className || ""} opacity-0 will-change-transform`}>
      <ScaleOutContent start={start} end={end} scale={scale} setActorStyle={setActorStyle}>
        {children}
      </ScaleOutContent>
    </Component>
  );
};
