import BrowserOnly from "@docusaurus/BrowserOnly";
import { Particles } from "@site/src/components/particles";
import { DotPattern } from "@site/src/components/ui/dot-pattern";
import { cn } from "@site/src/lib/utils";
import { Zap, Rocket, BookOpen, Sparkles } from "lucide-react";
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
    <div className="absolute top-1.5 right-1.5 z-20">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
          "font-medium tracking-wider uppercase",
          "border bg-white/[0.03] backdrop-blur-sm",
          config.classes,
        )}
      >
        <Icon className="size-3 opacity-60" />
        <span className="text-[12px]">{config.label}</span>
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
  return (
    <div
      className={cn(
        "relative max-w-4xl mx-auto rounded-3xl mb-3 p-px bg-gradient-to-br from-transparent via-zinc-300/20 to-transparent",
        "transition-all duration-300 ease-out",
        "hover:brightness-110 hover:shadow-[0_0_40px_-8px_rgba(251,198,70,0.15)]",
      )}
    >
      {/* Link overlay */}
      {href && <a href={href} className="absolute inset-0 z-30 rounded-3xl" aria-label={title} />}
      <section
        className={cn(
          "relative w-full overflow-hidden rounded-[23px]",
          "bg-gradient-to-b from-[#1c1917] to-[#111113]",
          "min-h-[280px] py-8",
          "flex flex-col items-center justify-center",
          className,
        )}
      >
        {/* Badge - floating at top */}
        {badge && <Badge type={badge} />}

        {/* Subtle top glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-[400px] h-[300px] rounded-full bg-amber-500/15 blur-[100px]" />
        </div>
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 pointer-events-none" aria-hidden="true">
          <div className="w-40 h-40 rounded-full bg-amber-400/20 blur-[60px]" />
        </div>

        {/* Page illustration - subtle arcs */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-4 pointer-events-none opacity-20" aria-hidden="true">
          <img
            src="/img/page-illustration.svg"
            className="max-w-none min-w-[900px] text-amber-500"
            width={1100}
            alt=""
          />
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 z-[1]" aria-hidden="true">
          <BackgroundPattern pattern={resolvedPattern} focus={patternFocus} mask={resolvedMask} />
        </div>

        {/* Particles */}
        <BrowserOnly>
          {() => (
            <Particles className="absolute inset-0 z-[2]" quantity={30} color="#fbc646" size={0.4} staticity={50} />
          )}
        </BrowserOnly>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-6 py-4">
          {/* Lightning bolt */}
          <div className="mb-3" style={{ filter: "drop-shadow(0 0 20px rgba(251, 198, 70, 0.5))" }}>
            <Zap className="w-10 h-10 text-[#fbc646] fill-[#fbc646]" />
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-center tracking-tight mb-1 !text-transparent bg-clip-text bg-gradient-to-b from-zinc-200/60 via-zinc-200 to-zinc-200/60">
            {title}
          </h2>

          {/* Description */}
          {description && <p className="text-base md:text-lg text-zinc-400 text-center mb-4 max-w-md">{description}</p>}

          {/* Terminal window with children */}
          {children && (
            <TerminalWindow file={file} className="-mb-5">
              {children}
            </TerminalWindow>
          )}
        </div>
      </section>
    </div>
  );
}
