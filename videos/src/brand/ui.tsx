import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";

import { fitTitle, useFontsLoaded, useTitleWidth } from "./fit";
import { easeInOut, outQuint, progress, rise, sec } from "./motion";
import { body, clipText, color, display, eyebrowGradient, goldGradient, mono, titleGradient, titleGradientMuted } from "./tokens";

/* The bolt, the same path as the site's HfBolt */
export const Bolt: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <svg viewBox="79 35 134 230" width={size * (134 / 230)} height={size} style={style}>
    <path fill={color.bolt} d="M118.65 35.43h85.21l-36.05 67.37h44.25L104.99 264.91l28.41-119.4H79.32l39.33-110.08Z" />
  </svg>
);

/* The footer's logo tile: a gold tinted square with a ring and a soft glow */
export const BoltTile: React.FC<{ size?: number; glow?: number }> = ({ size = 72, glow = 1 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.305,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(251,198,70,0.1)",
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 ${Math.max(1, size / 36)}px rgba(251,198,70,0.22), 0 0 ${size * 0.66}px -${size / 6}px rgba(251,198,70,${0.5 * glow})`,
    }}
  >
    <Bolt size={size * 0.56} />
  </div>
);

export const Lockup: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.32 }}>
    <BoltTile size={size} />
    <span style={{ fontFamily: display, fontWeight: 800, fontSize: size * 0.56, letterSpacing: "-0.02em", color: color.zinc50 }}>HyperFetch</span>
  </div>
);

export const LogoMark: React.FC<{ height?: number; style?: React.CSSProperties }> = ({ height = 44, style }) => (
  <Img src={staticFile("hf-logo.svg")} style={{ height, width: "auto", ...style }} />
);

export const Eyebrow: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 30, style }) => (
  <div style={{ fontFamily: body, fontWeight: 500, fontSize: size, lineHeight: 1.3, ...clipText(eyebrowGradient), display: "inline-block", ...style }}>
    {children}
  </div>
);

export const Gold: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ ...clipText(goldGradient), paddingBottom: "0.08em" }}>{children}</span>
);

/*
 * Big Figtree type with the landing's fading zinc gradient. Each word rises out of its own clip mask on a long
 * quint settle, the way the HypeStack film sets its headlines, so the type arrives crisp instead of fading in.
 */
export const Title: React.FC<{
  children: string;
  size?: number;
  delay?: number;
  stagger?: number;
  muted?: boolean;
  align?: "left" | "center";
  gold?: string[];
  style?: React.CSSProperties;
  /* The width the title may take; defaults to the layout's (Split copy column, Stack content) */
  width?: number;
}> = ({ children, size = 96, delay = 0, stagger = 3, muted, align = "left", gold = [], style, width }) => {
  const frame = useCurrentFrame();
  const available = useTitleWidth();
  const ready = useFontsLoaded();
  const fitted = ready ? fitTitle(children, size, width ?? available) : { lines: [children.split(" ")], size };
  let index = 0;
  return (
    <div
      style={{
        fontFamily: display,
        fontWeight: 800,
        fontSize: fitted.size,
        lineHeight: 1.04,
        letterSpacing: "-0.045em",
        textAlign: align,
        ...style,
      }}
    >
      {fitted.lines.map((line, li) => (
        <div key={`${li}-${line.join(" ")}`} style={{ whiteSpace: "nowrap" }}>
          {line.map((word, wi) => {
            const i = index;
            index += 1;
            const isGold = gold.includes(word);
            const p = progress(frame, delay + i * stagger, sec(0.7), outQuint);
            return (
              <span
                key={`${word}-${i}`}
                data-rise-clip
                /*
                  The clip box gets the same side room as clipText, cancelled by negative margins: a box exactly as
                  wide as the word clipped the overhang of its last letter (the "s" of "knows").
                */
                style={{ display: "inline-block", whiteSpace: "pre", overflow: "hidden", verticalAlign: "top", padding: "0 0.12em 0.12em 0.08em", margin: "0 -0.12em -0.12em -0.08em" }}
              >
                {/*
                  The word starts a full height plus 0.7em below its clip box: the box is 0.12em taller than the word
                  (room for descenders) and the 3 degree tilt lifts one corner, so starting only 105% down left the
                  tops of letters showing at the bottom of the box before the word rose.
                */}
                <span
                  data-rise={p === 0 ? "pending" : undefined}
                  style={{
                    display: "inline-block",
                    transform: `translateY(calc(${1 - p} * (100% + 0.7em))) rotate(${(1 - p) * (i % 2 ? 3 : -3)}deg)`,
                    transformOrigin: "0% 100%",
                  }}
                >
                  <span style={{ ...clipText(isGold ? goldGradient : muted ? titleGradientMuted : titleGradient), paddingBottom: "0.08em", display: "inline-block" }}>{word}</span>
                </span>
                {wi < line.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Lead: React.FC<{ children: React.ReactNode; size?: number; delay?: number; style?: React.CSSProperties }> = ({
  children,
  size = 32,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ fontFamily: body, fontSize: size, lineHeight: 1.45, color: color.zinc400, ...rise(frame, delay), ...style }}>{children}</div>
  );
};

/* Inline code, like the docs' backtick spans */
export const Code: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span
    style={{
      fontFamily: mono,
      fontSize: "0.82em",
      color: color.zinc200,
      background: "rgba(255,255,255,0.06)",
      border: `1px solid ${color.line}`,
      borderRadius: 10,
      padding: "0.06em 0.34em",
      ...style,
    }}
  >
    {children}
  </span>
);

/* The hero's "Just shipped" pill */
export const ReleasePill: React.FC<{ label: string; text: string; delay?: number; scale?: number }> = ({ label, text, delay = 0, scale = 1.6 }) => {
  const frame = useCurrentFrame();
  /* One ping as the pill lands, then still: nothing loops after landing */
  const ping = Math.min(1, Math.max(0, (frame - delay - 10) / 50));
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10 * scale,
        height: 32 * scale,
        padding: `0 ${12 * scale}px 0 ${8 * scale}px`,
        borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
        ...rise(frame, delay),
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6 * scale,
          padding: `${2 * scale}px ${8 * scale}px`,
          borderRadius: 999,
          background: "rgba(251,198,70,0.1)",
          boxShadow: "inset 0 0 0 1px rgba(251,198,70,0.25)",
          color: color.bolt,
          fontFamily: body,
          fontWeight: 600,
          fontSize: 11 * scale,
        }}
      >
        <span style={{ position: "relative", width: 6 * scale, height: 6 * scale }}>
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              background: color.bolt,
              opacity: 0.75 * (1 - ping),
              transform: `scale(${1 + ping * 1.6})`,
            }}
          />
          <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: color.bolt }} />
        </span>
        {label}
      </span>
      <span style={{ fontFamily: body, fontWeight: 500, fontSize: 13 * scale, color: color.zinc300 }}>{text}</span>
    </div>
  );
};

/* A diagonal light sweeping across a card once, the HypeStack sheen */
const Sheen: React.FC<{ at: number; radius: number }> = ({ at, radius }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, sec(0.75), easeInOut);
  if (frame < at || p >= 1) return null;
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", pointerEvents: "none", zIndex: 3 }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${-60 + p * 160}%`,
          width: "60%",
          background: "linear-gradient(105deg, transparent 30%, rgba(255,240,210,0.13) 50%, transparent 70%)",
        }}
      />
    </div>
  );
};

/*
 * A zinc-900 card with the hairline ring and a lit top edge, like the bento cards on the landing.
 * - `bezel` sets it in a translucent outer shell, a double frame that reads as hardware rather than a div.
 * - `sheenAt` sweeps a light across it once, right after it lands.
 * - `ring` (0 to 1) draws the gold focus ring that hands off between cards on the beat.
 */
export const Card: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  radius?: number;
  lit?: boolean;
  glow?: boolean;
  bezel?: boolean;
  sheenAt?: number;
  ring?: number;
}> = ({ children, style, radius = 28, lit = true, glow = false, bezel = false, sheenAt, ring = 0 }) => {
  const inner = (
    <div
      data-fit="card"
      data-solid
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: radius,
        background: `linear-gradient(to bottom, ${color.panelTop}, ${color.panelBottom})`,
        border: `1px solid ${color.line}`,
        boxShadow: bezel
          ? "inset 0 1px 0 rgba(255,255,255,0.07)"
          : "inset 0 1px 0 rgba(255,255,255,0.06), 0 40px 80px -40px rgba(0,0,0,0.95), 0 12px 30px -12px rgba(0,0,0,0.6)",
        ...style,
      }}
    >
      {/* Decoration in its own clipped layer, so it never counts as overflowing content */}
      {(glow || lit) && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {glow && (
            <div
              style={{
                position: "absolute",
                top: -180,
                left: -140,
                width: 520,
                height: 420,
                borderRadius: "50%",
                background: "radial-gradient(closest-side, rgba(251,198,70,0.13), transparent)",
              }}
            />
          )}
          {lit && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "10%",
                right: "10%",
                height: 1,
                background: "linear-gradient(to right, transparent, rgba(255,224,138,0.35), transparent)",
              }}
            />
          )}
        </div>
      )}
      {children}
      {sheenAt !== undefined && <Sheen at={sheenAt} radius={radius} />}
    </div>
  );
  const ringed =
    ring > 0 ? (
      <div style={{ position: "relative" }}>
        {inner}
        <div
          style={{
            position: "absolute",
            inset: -12,
            borderRadius: radius + 12,
            border: "2px solid rgba(251,198,70,0.8)",
            boxShadow: "0 0 0 7px rgba(251,198,70,0.1), 0 0 90px rgba(245,166,35,0.4), inset 0 0 40px rgba(251,198,70,0.1)",
            opacity: ring,
            transform: `scale(${1.03 - 0.03 * ring})`,
            pointerEvents: "none",
          }}
        />
      </div>
    ) : (
      inner
    );
  if (!bezel) return ringed;
  return (
    <div
      style={{
        padding: 9,
        borderRadius: radius + 9,
        background: "rgba(255,255,255,0.035)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 40px 90px -30px rgba(0,0,0,0.85)",
      }}
    >
      {ringed}
    </div>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; tone?: "zinc" | "gold" | "green" | "red" | "blue"; size?: number; style?: React.CSSProperties }> = ({
  children,
  tone = "zinc",
  size = 22,
  style,
}) => {
  const tones = {
    zinc: { bg: "rgba(255,255,255,0.05)", ring: "rgba(255,255,255,0.1)", fg: color.zinc300 },
    gold: { bg: "rgba(251,198,70,0.1)", ring: "rgba(251,198,70,0.3)", fg: color.bolt },
    green: { bg: "rgba(52,211,153,0.1)", ring: "rgba(52,211,153,0.3)", fg: color.green },
    red: { bg: "rgba(244,63,94,0.1)", ring: "rgba(244,63,94,0.32)", fg: "#fb7185" },
    blue: { bg: "rgba(96,165,250,0.1)", ring: "rgba(96,165,250,0.3)", fg: color.blue },
  }[tone];
  return (
    <span
      data-solid
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.4,
        padding: `${size * 0.28}px ${size * 0.65}px`,
        borderRadius: 999,
        background: tones.bg,
        boxShadow: `inset 0 0 0 1px ${tones.ring}`,
        color: tones.fg,
        fontFamily: body,
        fontWeight: 600,
        fontSize: size,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const Logo: React.FC<{ name: string; size?: number; style?: React.CSSProperties }> = ({ name, size = 56, style }) => (
  <Img src={staticFile(`logos/${name}.svg`)} style={{ height: size, width: "auto", ...style }} />
);

/* A chip with an integration's logo in front of its name, for every place a package or adapter is named */
export const LogoChip: React.FC<{ logo: string; children: React.ReactNode; size?: number; tone?: "zinc" | "gold"; style?: React.CSSProperties }> = ({
  logo,
  children,
  size = 22,
  tone = "zinc",
  style,
}) => (
  <span
    data-solid
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.5,
      padding: `${size * 0.32}px ${size * 0.7}px ${size * 0.32}px ${size * 0.42}px`,
      borderRadius: 999,
      background: tone === "gold" ? "rgba(251,198,70,0.08)" : "rgba(255,255,255,0.05)",
      boxShadow: `inset 0 0 0 1px ${tone === "gold" ? "rgba(251,198,70,0.3)" : "rgba(255,255,255,0.1)"}`,
      color: tone === "gold" ? color.bolt : color.zinc200,
      fontFamily: body,
      fontWeight: 600,
      fontSize: size,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <span
      style={{
        width: size * 1.45,
        height: size * 1.45,
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Img src={staticFile(`logos/${logo}.svg`)} style={{ maxHeight: size * 0.95, maxWidth: size * 1.05, width: "auto", height: "auto" }} />
    </span>
    {children}
  </span>
);

export type LogoItem = { logo: string; label: string };

/* A row of logo chips dealt in one per eighth note from `at` */
export const LogoStrip: React.FC<{ items: LogoItem[]; at: number; size?: number; step?: number; style?: React.CSSProperties }> = ({ items, at, size = 22, step = 8, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: size * 0.6, ...style }}>
      {items.map((item, i) => {
        const p = progress(frame, at + i * step, sec(0.6), outQuint);
        return (
          <span key={item.logo + item.label} style={{ display: "inline-block", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})` }}>
            <LogoChip logo={item.logo} size={size}>
              {item.label}
            </LogoChip>
          </span>
        );
      })}
    </div>
  );
};
