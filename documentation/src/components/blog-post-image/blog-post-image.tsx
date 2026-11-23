import BrowserOnly from "@docusaurus/BrowserOnly";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { Particles } from "@site/src/components/particles";
import { DotPattern } from "@site/src/components/ui/dot-pattern";
import { cn } from "@site/src/lib/utils";
import { Rocket, BookOpen, Sparkles } from "lucide-react";
import React from "react";

import {
  GridPattern,
  StripedPattern,
  HexagonPattern,
  InteractiveGridPattern,
  FlickeringGrid,
  RetroGrid,
  PathsPattern,
} from "./patterns";
import { TerminalWindow } from "./terminal-window";

type PatternType = "dots" | "grid" | "hexagon" | "striped" | "flickering" | "retro" | "interactive" | "paths";
type PatternFocus = "top" | "center" | "bottom";
type PatternMask = "full" | "radial" | "top" | "bottom" | "sides" | "left" | "right" | "rectangle";
type BadgeType = "release" | "tutorial" | "feature";

interface BlogPostImageProps {
  title: string;
  description?: string;
  pattern?: PatternType;
  patternFocus?: PatternFocus;
  patternMask?: PatternMask;
  badge?: BadgeType;
  href?: string;
  file?: string;
  children?: React.ReactNode;
  className?: string;
}

const badgeConfig: Record<BadgeType, { label: string; icon: React.ElementType; classes: string }> = {
  release: {
    label: "Release",
    icon: Rocket,
    classes: "border-zinc-500/20 text-zinc-400",
  },
  tutorial: {
    label: "Tutorial",
    icon: BookOpen,
    classes: "border-zinc-500/20 text-zinc-400",
  },
  feature: {
    label: "Feature",
    icon: Sparkles,
    classes: "border-zinc-500/20 text-zinc-400",
  },
};

const maskByFocus: Record<PatternFocus, string> = {
  top: "[mask-image:radial-gradient(ellipse_70%_65%_at_50%_20%,black_20%,transparent_75%)]",
  center: "[mask-image:radial-gradient(ellipse_65%_60%_at_50%_50%,black_20%,transparent_75%)]",
  bottom: "[mask-image:radial-gradient(ellipse_70%_65%_at_50%_80%,black_20%,transparent_75%)]",
};

const maskStyles: Record<PatternMask, string> = {
  full: "",
  radial: "",
  top: "[mask-image:linear-gradient(to_bottom,transparent_0%,black_40%,black_100%)]",
  bottom: "[mask-image:linear-gradient(to_top,transparent_0%,black_40%,black_100%)]",
  sides: "[mask-image:linear-gradient(to_right,transparent_0%,black_25%,black_75%,transparent_100%)]",
  left: "[mask-image:linear-gradient(to_right,transparent_0%,black_40%,black_100%)]",
  right: "[mask-image:linear-gradient(to_left,transparent_0%,black_40%,black_100%)]",
  rectangle: "",
};

/** When `patternMask` is omitted, pick a sensible default fade for each pattern. */
function resolvePatternMask(pattern: PatternType, explicit: PatternMask | undefined): PatternMask {
  if (explicit !== undefined) return explicit;
  if (pattern === "hexagon") return "top";
  if (pattern === "striped") return "radial";
  return "radial";
}

function Badge({ type }: { type: BadgeType }) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <div className="absolute left-4 top-4 z-20">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
          "font-semibold uppercase tracking-[0.12em]",
          "border border-solid bg-white/[0.03]",
          config.classes,
        )}
      >
        <Icon className="size-3 opacity-60" />
        <span className="text-[10.5px]">{config.label}</span>
      </div>
    </div>
  );
}

function BackgroundPattern({
  pattern,
  focus = "center",
  mask = "radial",
}: {
  pattern: PatternType;
  focus?: PatternFocus;
  mask?: PatternMask;
}) {
  const maskClass = mask === "radial" ? maskByFocus[focus] : maskStyles[mask];
  const rectangleStyle: React.CSSProperties | undefined =
    mask === "rectangle"
      ? {
          maskImage:
            "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }
      : undefined;
  const patternClass = mask === "rectangle" ? "" : maskClass;

  const content = (() => {
    switch (pattern) {
      case "dots":
        return <DotPattern width={18} height={18} cr={1.2} glow className={cn("text-zinc-400/30", patternClass)} />;
      case "grid":
        return (
          <GridPattern width={36} height={36} className={cn("stroke-zinc-400/20 fill-transparent", patternClass)} />
        );
      case "hexagon":
        return <HexagonPattern radius={28} className={cn("stroke-zinc-600 !opacity-20", patternClass)} />;
      case "striped":
        return <StripedPattern width={28} height={28} className={cn("stroke-zinc-600 !opacity-20", patternClass)} />;
      case "flickering":
        return (
          <BrowserOnly>
            {() => (
              <FlickeringGrid
                squareSize={4}
                gridGap={6}
                color="#a1a1aa"
                maxOpacity={0.2}
                flickerChance={0.1}
                className={patternClass}
              />
            )}
          </BrowserOnly>
        );
      case "retro":
        return <RetroGrid angle={65} cellSize={50} opacity={0.3} className={patternClass} />;
      case "interactive":
        return (
          <BrowserOnly>
            {() => (
              <InteractiveGridPattern
                width={30}
                height={30}
                squares={[30, 20]}
                className={cn("stroke-zinc-400/20 fill-transparent text-zinc-400/30", patternClass)}
              />
            )}
          </BrowserOnly>
        );
      case "paths":
        return <PathsPattern className={patternClass} />;
      default:
        return null;
    }
  })();

  if (rectangleStyle) {
    return (
      <div className="absolute inset-0" style={rectangleStyle}>
        {content}
      </div>
    );
  }

  return content;
}

/*
 * The post hero in the style of the README banner: flat dark, one soft gold glow from the top, the pattern at a
 * whisper, the HyperFetch lockup, then the title in big type. No border gradient, no spotlight, no hover glow:
 * it is a cover, not a button.
 */
export function BlogPostImage({
  title,
  description,
  pattern,
  patternFocus = "center",
  patternMask,
  badge,
  href,
  file,
  children,
  className,
}: BlogPostImageProps) {
  const resolvedPattern = pattern ?? (badge === "release" ? "paths" : "dots");
  const resolvedMask = resolvePatternMask(resolvedPattern, patternMask);
  const logo = useBaseUrl("/img/brand/HF.svg");
  return (
    <div className="relative mx-auto mb-3 max-w-4xl">
      {href && <a href={href} className="absolute inset-0 z-30 rounded-[22px]" aria-label={title} />}
      <section
        className={cn(
          "relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[22px]",
          "bg-[#1d1d1f] ring-1 ring-inset ring-white/[0.06]",
          children ? "min-h-[300px] pb-0 pt-10" : "min-h-[280px] py-12",
          className,
        )}
      >
        {/* One soft glow, off centre, like the README banner */}
        <div
          className="pointer-events-none absolute -top-40 left-[58%] h-80 w-[36rem] -translate-x-1/2 rounded-full bg-[#f5a623]/[0.16] blur-[90px]"
          aria-hidden="true"
        />

        {/* The pattern is texture, not a feature */}
        <div className="absolute inset-0 z-[1] opacity-60" aria-hidden="true">
          <BackgroundPattern pattern={resolvedPattern} focus={patternFocus} mask={resolvedMask} />
        </div>

        <BrowserOnly>
          {() => (
            <Particles className="absolute inset-0 z-[2]" quantity={18} color="#fbc646" size={0.35} staticity={60} />
          )}
        </BrowserOnly>

        {badge && <Badge type={badge} />}

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6">
          <img src={logo} alt="" className="mb-5 h-6 w-auto opacity-95 md:h-7" />

          <h2 className="!m-0 max-w-[16ch] text-center text-[2rem] font-extrabold leading-[1.02] tracking-[-0.045em] !text-zinc-50 [font-family:Figtree] md:text-5xl lg:text-[3.5rem]">
            {title}
          </h2>

          {description && (
            <p className="!mb-0 mt-4 max-w-md text-center text-base leading-relaxed !text-zinc-400 md:text-lg">
              {description}
            </p>
          )}

          {children && (
            <TerminalWindow file={file} className="-mb-6 mt-8">
              {children}
            </TerminalWindow>
          )}
        </div>
      </section>
    </div>
  );
}
