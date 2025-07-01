import React, { forwardRef, useRef } from "react";
import { cn } from "@site/src/lib/utils";
import ReactIcon from "@site/static/img/integration-react.svg";
import NextIcon from "@site/static/img/integration-next.svg";
import AstroIcon from "@site/static/img/integration-astro.svg";
import HyperFetchLogo from "@site/static/img/logo.png";
import NestIcon from "@site/static/img/integration-nest.svg";
import RestIcon from "@site/static/img/integration-rest.svg";
import StrapiIcon from "@site/static/img/integration-strapi.svg";

import { AnimatedBeam } from "./beam";
import { FeaturesCard } from "./features-card";
import { Box } from "./box";
import { Particles } from "../../particles";

const Circle = forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode }>(
  ({ className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

Circle.displayName = "Circle";

export function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <FeaturesCard>
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden p-10" ref={containerRef}>
        <Particles className="absolute inset-0 z-[-1] opacity-30" />
        <div className="relative z-[9999] flex size-full h-full max-w-lg flex-col items-stretch justify-between gap-10">
          <div className="flex flex-row items-center justify-between">
            <Box
              ref={div1Ref}
              className="flex justify-center items-center size-12 aspect-square bg-gradient-to-b from-neutral-800 to-neutral-700"
            >
              <ReactIcon className="aspect-square w-1/2 h-auto" />
            </Box>
            <Box
              ref={div5Ref}
              className="flex justify-center items-center size-12 aspect-square bg-gradient-to-b from-neutral-800 to-neutral-700"
            >
              <NextIcon className="aspect-square w-1/2 h-auto invert" />
            </Box>
          </div>
          <div className="flex flex-row items-center justify-between">
            <Box
              ref={div2Ref}
              className="flex justify-center items-center size-12 aspect-square bg-gradient-to-b from-neutral-800 to-neutral-700"
            >
              <AstroIcon className="aspect-square w-1/2 h-auto" />
            </Box>
            <div ref={div4Ref}>
              <img src={HyperFetchLogo} alt="HyperFetch" className="size-16 shadow-lg rounded-lg" />
            </div>
            <Box
              ref={div6Ref}
              className="flex justify-center items-center size-12 aspect-square bg-gradient-to-b from-neutral-800 to-neutral-700"
            >
              <NestIcon className="aspect-square w-1/2 h-auto" />
            </Box>
          </div>
          <div className="flex flex-row items-center justify-between">
            <Box
              ref={div3Ref}
              className="flex justify-center items-center size-12 aspect-square bg-gradient-to-b from-neutral-800 to-neutral-700"
            >
              <RestIcon className="aspect-square w-1/2 h-auto" />
            </Box>
            <Box
              ref={div7Ref}
              className="flex justify-center items-center size-12 aspect-square bg-gradient-to-b from-neutral-800 to-neutral-700"
            >
              <StrapiIcon className="aspect-square w-1/2 h-auto" />
            </Box>
          </div>
        </div>

        <AnimatedBeam containerRef={containerRef} fromRef={div1Ref} toRef={div4Ref} curvature={-75} endYOffset={-10} />
        <AnimatedBeam containerRef={containerRef} fromRef={div2Ref} toRef={div4Ref} />
        <AnimatedBeam containerRef={containerRef} fromRef={div3Ref} toRef={div4Ref} curvature={75} endYOffset={10} />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div5Ref}
          toRef={div4Ref}
          curvature={-75}
          endYOffset={-10}
          reverse
        />
        <AnimatedBeam containerRef={containerRef} fromRef={div6Ref} toRef={div4Ref} reverse />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div7Ref}
          toRef={div4Ref}
          curvature={75}
          endYOffset={10}
          reverse
        />
      </div>
    </FeaturesCard>
  );
}
