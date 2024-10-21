import React from "react";
import { useActors, useMakeup, Stage, StyleOptions } from "@react-theater/scroll";

const FadeInContent = ({
  children,
  start = 0.05,
  end = 0.25,
  translateY = 50,
  setActorStyle,
}: {
  children: React.ReactNode;
  start?: number;
  end?: number;
  translateY?: number;
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
          translateY: `${translateY - translateY * progress}px`,
        });
      },
    },
  ]);

  return children;
};

export const FadeIn = ({
  children,
  start,
  end,
  translateY,
  className,
  isStage = true,
  ...rest
}: {
  children: React.ReactNode;
  start?: number;
  end?: number;
  translateY?: number;
  isStage?: boolean;
} & React.HTMLProps<HTMLDivElement>) => {
  const [actorRef, setActorStyle] = useMakeup();

  const Component = isStage ? Stage : "div";

  return (
    <Component {...rest} ref={actorRef} className={`${className || ""} opacity-0 will-change-transform`}>
      <FadeInContent start={start} end={end} translateY={translateY} setActorStyle={setActorStyle}>
        {children}
      </FadeInContent>
    </Component>
  );
};
