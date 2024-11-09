import { useLayoutEffect } from "react";
import { useWindowSize } from "@reins/hooks";

import { Animation } from "../animations/animation.types";
import { dotAnimation } from "../animations/dot.animation";
import { labelAnimation } from "../animations/label.animation";
import { glowAnimation } from "../animations/glow.animation";

function getMatrix(element: HTMLDivElement) {
  const { transform } = element.style;
  const re = /translate3d\((?<x>.*?)px, (?<y>.*?)px, (?<z>.*?)px/;
  const results = re.exec(transform);

  if (!results) {
    return {
      x: 0,
      y: 0,
      z: 0,
    };
  }

  return {
    x: results.groups.x as unknown as number,
    y: results.groups.y as unknown as number,
    z: results.groups.z as unknown as number,
  };
}

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
      onUpdate: () => {
        const item = document.querySelector(animation.item) as HTMLDivElement;
        const gradient = document.querySelector(`#gradient${animation.index}`) as SVGPathElement;
        const halo = document.querySelector(`#halo${animation.index}`) as SVGPathElement;
        const paths = document.querySelector(`#paths`) as SVGElement;
        const element = document.querySelector(animation.path) as SVGPathElement;

        if (!item || !gradient || !halo || !element || !paths) {
          return;
        }

        const { x, y } = getMatrix(item);

        const svgViewportWidth = 2000;
        const svgViewportHeight = 1000;
        const svgWidth = paths.getBoundingClientRect().width;
        const svgHeight = paths.getBoundingClientRect().height;
        const topOffset = 185;
        const leftOffset = -5;
        const scaleX = svgViewportWidth / svgWidth;
        const scaleY = svgViewportHeight / svgHeight;

        halo.setAttribute("cx", `${x * scaleX + leftOffset}`);
        halo.setAttribute("cy", `${y * scaleY + topOffset}`);

        gradient.setAttribute("cx", `${x * scaleX + leftOffset}`);
        gradient.setAttribute("cy", `${y * scaleY + topOffset}`);
      },
    });

    dotAnimation(animation);
    labelAnimation(animation);
    glowAnimation(animation);
  }, [animation, id, width]);

  return (
    <div id={`idItem${id}`} className="absolute">
      <div
        id={`idDot${id}`}
        className={`w-1 h-1 rounded-[100%] left-1/2 -translate-x-1/2 top-0 opacity-0 ${tool.dotClassName}`}
      />
      <span
        id={`idLabel${id}`}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-[2px] text-[10px] text-zinc-300 dark:text-zinc-500 opacity-0 whitespace-nowrap"
      >
        {tool.name}
      </span>
    </div>
  );
};
