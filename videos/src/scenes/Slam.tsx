import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { outExpo, progress, sec } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { clipText, display, goldGradient, titleGradient } from "../brand/tokens";

/*
 * A one-bar hype beat between chapters: the first line slams in on the downbeat, the gold second line two beats
 * later, each with a hit. Darker than the scenes around it, like the cold open, so it reads as a punctuation mark.
 */
const Line: React.FC<{ text: string; at: number; gold?: boolean }> = ({ text, at, gold }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = progress(frame, at, sec(0.3), outExpo);
  const grow = interpolate(frame, [at + sec(0.3), at + sec(2)], [1, 1.04], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        fontFamily: display,
        fontWeight: 900,
        fontSize: 200,
        lineHeight: 1,
        letterSpacing: "-0.05em",
        ...clipText(gold ? goldGradient : titleGradient),
        paddingBottom: "0.08em",
        opacity: p,
        filter: p < 1 ? `blur(${(1 - p) * 16}px)` : undefined,
        transform: `scale(${interpolate(p, [0, 1], [2, 1]) * grow})`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

export const Slam: React.FC<{ first: string; second: string }> = ({ first, second }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    {/* A dimmer chapter of the same film: the background stays alive, darker at the edges, warm behind the words */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(12,12,13,0.25), rgba(8,8,9,0.72))" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 38% 30% at 50% 50%, rgba(245,166,35,0.12), transparent)" }} />
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <Line text={first} at={30} />
      <Line text={second} at={90} gold />
    </div>
    <Sfx at={30} name="impact" volume={0.45} />
    <Sfx at={90} name="impact" volume={0.55} />
  </AbsoluteFill>
);
