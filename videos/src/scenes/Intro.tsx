import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";

import { pop, progress, rise, sec } from "../brand/motion";
import { body, color } from "../brand/tokens";
import { Sfx } from "../brand/Sfx";
import { BoltTile, type LogoItem, LogoStrip, ReleasePill, Title } from "../brand/ui";

/*
 * The cold open: the bolt tile lands with a gold shockwave, the release pill, then the topic in big Figtree type
 * and its one line from the blog cover. It follows the cold open, so it starts on its downbeat, the drop.
 */
const IntroContent: React.FC<{ title: string; description: string; label?: string; pill?: string; gold?: string[]; titleSize?: number; logos?: LogoItem[] }> = ({
  title,
  description,
  label = "HyperFetch 10",
  pill = "New in v10",
  gold,
  titleSize = 150,
  logos = [],
}) => {
  const frame = useCurrentFrame();
  const tile = pop(frame, 4, 11);
  const wave = progress(frame, 8, sec(1.1));
  const lift = interpolate(progress(frame, sec(0.55), sec(0.6)), [0, 1], [70, 0]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Sfx at={sec(0.45)} name="tick" volume={0.5} />
      <Sfx at={sec(0.6)} name="swish" volume={0.55} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${lift}px)` }}>
        <div style={{ position: "relative", marginBottom: 44 }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 120,
              height: 120,
              marginLeft: -60,
              marginTop: -60,
              borderRadius: 999,
              border: `2px solid ${color.bolt}`,
              opacity: (1 - wave) * 0.6,
              transform: `scale(${1 + wave * 5})`,
            }}
          />
          <div style={{ transform: `scale(${tile}) rotate(${(1 - tile) * -14}deg)` }}>
            <BoltTile size={104} glow={1.4} />
          </div>
        </div>

        <ReleasePill label={pill} text={label} delay={sec(0.45)} scale={1.7} />

        <Title size={titleSize} align="center" delay={sec(0.6)} stagger={4} gold={gold} style={{ marginTop: 38, maxWidth: 1600 }}>
          {title}
        </Title>

        <div
          style={{
            marginTop: 30,
            fontFamily: body,
            fontSize: 40,
            color: color.zinc400,
            textAlign: "center",
            maxWidth: 1300,
            lineHeight: 1.4,
            ...rise(frame, sec(1.05)),
          }}
        >
          {description}
        </div>

        {logos.length > 0 && <LogoStrip items={logos} at={sec(1.45)} size={26} step={6} style={{ marginTop: 44, maxWidth: 1500 }} />}
      </div>
    </AbsoluteFill>
  );
};

export const Intro: React.FC<React.ComponentProps<typeof IntroContent>> = (props) => (
  <Sequence from={30} name="intro content">
    <IntroContent {...props} />
  </Sequence>
);
