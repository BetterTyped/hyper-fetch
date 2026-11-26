import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { outExpo, outQuint, pop, progress, rise, sec } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { clipText, color, display, mono, titleGradient } from "../brand/tokens";
import { BoltTile, type LogoItem, LogoStrip, Title } from "../brand/ui";
import { TypingSfx } from "../visuals/common";

/*
 * The closing shot: no panel, just the brand. The lockup slams in on the downbeat with a gold shockwave, the
 * tagline rises out of its masks, the install command types itself in a gold pill, the post's address sits under
 * it, and the HyperFetch wordmark rises from below the frame, cut by the bottom edge like on the site.
 */

const CPS = 46;

const Command: React.FC<{ text: string; from: number }> = ({ text, from }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - from) / 60) * CPS)));
  const fontSize = Math.min(30, 1300 / (text.length * 0.6));
  const box = rise(frame, from - sec(0.35), 20, sec(0.5));
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 18,
        height: 84,
        padding: "0 34px",
        borderRadius: 20,
        background: "rgba(251,198,70,0.07)",
        boxShadow: "inset 0 0 0 1px rgba(251,198,70,0.35), 0 0 60px -20px rgba(251,198,70,0.45)",
        fontFamily: mono,
        fontSize,
        color: color.bolt,
        whiteSpace: "nowrap",
        fontVariantLigatures: "none",
        ...box,
      }}
    >
      <span style={{ color: color.zinc500 }}>$</span>
      <span style={{ minWidth: text.length * fontSize * 0.6 }}>{text.slice(0, n)}</span>
    </div>
  );
};

export const Outro: React.FC<{ install: string; post: string; links?: string[]; logos?: LogoItem[] }> = ({ install, post, logos = [] }) => {
  const frame = useCurrentFrame();
  /* The scene enters on the transition beat; the lockup lands on the downbeat */
  const land = 30;
  const slam = progress(frame, land, sec(0.45), outExpo);
  const wave = progress(frame, land, sec(1.2), outQuint);
  const word = progress(frame, land + sec(0.2), sec(1.6), outQuint);
  const typeFrom = land + sec(1.5);
  const typedAt = typeFrom + (install.length / CPS) * 60;
  const tile = pop(frame, land, 12);

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      {/* A soft gold bloom behind the lockup */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: "50%",
          width: 1300,
          height: 640,
          marginLeft: -650,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(245,166,35,0.16), transparent)",
          opacity: slam,
        }}
      />

      <div style={{ position: "absolute", top: 196, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 34 }}>
          <div
            style={{
              position: "absolute",
              left: 68,
              top: "50%",
              width: 140,
              height: 140,
              marginLeft: -70,
              marginTop: -70,
              borderRadius: 999,
              border: `2px solid ${color.bolt}`,
              opacity: (1 - wave) * 0.7 * (frame >= land ? 1 : 0),
              transform: `scale(${1 + wave * 7})`,
            }}
          />
          <div style={{ transform: `scale(${tile})` }}>
            <BoltTile size={136} glow={1.6} />
          </div>
          <div
            style={{
              fontFamily: display,
              fontWeight: 800,
              fontSize: 150,
              letterSpacing: "-0.045em",
              lineHeight: 1,
              ...clipText(titleGradient),
              paddingBottom: "0.08em",
              opacity: slam,
              filter: slam < 1 ? `blur(${(1 - slam) * 14}px)` : undefined,
              transform: `scale(${interpolate(slam, [0, 1], [1.5, 1])})`,
              transformOrigin: "0% 50%",
            }}
          >
            HyperFetch
          </div>
        </div>

        <div style={{ marginTop: 34 }}>
          <Title size={58} delay={land + sec(0.55)} stagger={4} gold={["anything."]} align="center">
            Fetch anything. Type everything.
          </Title>
        </div>

        {logos.length > 0 && <LogoStrip items={logos} at={land + sec(0.9)} size={22} step={5} style={{ marginTop: 40, maxWidth: 1400 }} />}

        <div style={{ marginTop: logos.length > 0 ? 40 : 56 }}>
          <Command text={install} from={typeFrom} />
        </div>

        <div style={{ marginTop: 30, fontFamily: mono, fontSize: 28, color: color.zinc400, letterSpacing: "0.01em", ...rise(frame, typedAt + 6, 14) }}>
          hyperfetch.bettertyped.com<span style={{ color: color.zinc300 }}>/blog/{post}</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: -84,
          width: "100%",
          textAlign: "center",
          fontFamily: display,
          fontWeight: 900,
          fontSize: 372,
          lineHeight: 1,
          letterSpacing: "-0.055em",
          whiteSpace: "nowrap",
          ...clipText("linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0) 78%)"),
          opacity: word,
          transform: `translateY(${interpolate(word, [0, 1], [160, 0])}px)`,
        }}
      >
        HyperFetch
      </div>

      <Sfx at={land} name="boom" volume={0.5} />
      <TypingSfx from={typeFrom} chars={install.length} cps={CPS} every={4} />
      <Sfx at={typedAt + 4} name="ding" volume={0.45} />
    </AbsoluteFill>
  );
};
