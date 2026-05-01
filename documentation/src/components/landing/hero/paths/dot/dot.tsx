import { useLayoutEffect } from "react";
import { useWindowSize } from "@site/src/hooks/use-window-size";

import { Animation } from "../animations/animation.types";
import { dotAnimation } from "../animations/dot.animation";
import { labelAnimation } from "../animations/label.animation";

export const Dot = ({
  id,
  tool,
  animation,
}: {
  id: number;
  tool: { name: string; dotClassName: string };
  animation: Parameters<Animation>[0];
}) => {
  const [width] = useWindowSize();

  useLayoutEffect(() => {
    animation.timeline.set(animation.item, { xPercent: -50, yPercent: -50, transformOrigin: "50% 50%" });
    animation.timeline.to(animation.item, {
      motionPath: {
        path: animation.path,
        align: animation.path,
        autoRotate: true,
        start: 0,
        end: 1,
      },
      duration: animation.duration,
    });

    dotAnimation(animation);
    labelAnimation(animation);
  }, [animation, id, width]);

  return (
    <div id={`idItem${id}`} className="absolute">
      <div
        id={`idDot${id}`}
        className={`w-[2px] h-[2px] rounded-[100%] left-1/2 -translate-x-1/2 top-0 will-change-[opacity,transform] ${tool.dotClassName}`}
        style={{ visibility: "hidden" }}
      />
      <span
        id={`idLabel${id}`}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-[0px] text-[10px] text-zinc-300 dark:text-zinc-500 will-change-[opacity,visibility] whitespace-nowrap"
        style={{ visibility: "hidden" }}
      >
        {tool.name}
      </span>
    </div>
  );
};
