import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { outExpo, progress, sec } from "../brand/motion";
import { clipText, display, goldGradient, titleGradient } from "../brand/tokens";
import { Title } from "../brand/ui";

/*
 * The cold open, after the HypeStack film: a darker chapter where four words slam in, one per beat, each replacing
 * the last; then one line states the problem the video answers. The brand arrives with the drop in the next scene.
 * Each word lands once and only grows a little after landing; nothing pulses or loops.
 */
export const Hook: React.FC<{ words: [string, string, string, string]; line: string; gold?: string[] }> = ({ words, line, gold = [] }) => {
  const frame = useCurrentFrame();
  const BEATF = 30;
  const current = Math.floor(frame / BEATF);
  const lineAt = BEATF * 4;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* The chapter is darker than the rest of the film */}
      {/* A dimmer chapter of the same film: the background stays alive, darker at the edges, warm behind the words */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(12,12,13,0.25), rgba(8,8,9,0.72))" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 38% 30% at 50% 50%, rgba(245,166,35,0.12), transparent)" }} />

      {frame < lineAt &&
        words.map((word, i) => {
          if (i !== current) return null;
          const at = i * BEATF;
          const p = progress(frame, at, sec(0.3), outExpo);
          const grow = interpolate(frame, [at + sec(0.3), at + BEATF], [1, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const last = i === words.length - 1;
          return (
            <div
              key={`${i}-${word}`}
              style={{
                position: "absolute",
                fontFamily: display,
                fontWeight: 900,
                fontSize: 230,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                ...clipText(last ? goldGradient : titleGradient),
                paddingBottom: "0.08em",
                opacity: p,
                filter: p < 1 ? `blur(${(1 - p) * 16}px)` : undefined,
                transform: `scale(${interpolate(p, [0, 1], [2.1, 1]) * grow})`,
              }}
            >
              {word}
            </div>
          );
        })}

      {frame >= lineAt && (
        <div style={{ position: "absolute", width: 1600, display: "flex", justifyContent: "center" }}>
          <Title size={108} align="center" delay={lineAt} stagger={4} gold={gold}>
            {line}
          </Title>
        </div>
      )}
    </AbsoluteFill>
  );
};
