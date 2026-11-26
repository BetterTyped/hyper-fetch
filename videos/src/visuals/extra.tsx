import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { deal, easeOut, progress, sec } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { body, color, display } from "../brand/tokens";
import { Card, Chip, Gold, Logo } from "../brand/ui";

/*
 * Shared pieces for feature montages: line icons stroked in the BetterTyped gold, a feature card that pops in on
 * a beat with its own click, a count-up number and a row of logos.
 */

const ICONS: Record<string, string[]> = {
  check: ["M20 6 9 17l-5-5"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  refresh: ["M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", "M21 3v5h-5", "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", "M8 16H3v5"],
  list: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"],
  shield: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
    "m9 12 2 2 4-4",
  ],
  zap: ["M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"],
  server: ["M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z", "M2 16a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z", "M6 6h.01", "M6 18h.01"],
  layers: ["m12.83 2.18 8.58 3.9a1 1 0 0 1 0 1.83l-8.58 3.9a2 2 0 0 1-1.66 0L2.6 7.91a1 1 0 0 1 0-1.83l8.58-3.9a2 2 0 0 1 1.66 0Z", "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65", "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"],
  sparkles: ["M9.94 14.06 8 21l-1.94-6.94L-1 12l7.06-1.94L8 3l1.94 7.06L17 12z", "M20 3v4", "M22 5h-4"],
  terminal: ["m4 17 6-6-6-6", "M12 19h8"],
  wifiOff: ["M12 20h.01", "M8.5 16.43a5 5 0 0 1 7 0", "M2 8.82a15 15 0 0 1 4.17-2.65", "M10.66 5c4.01-.36 8.14.9 11.34 3.76", "M16.85 11.25a10 10 0 0 1 2.22 1.68", "M5 13a10 10 0 0 1 5.24-2.76", "m2 2 20 20"],
  clock: ["M12 6v6l4 2", "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0"],
};

export type IconName = keyof typeof ICONS;

/* A lucide-style line icon. Gold by default, through the same gradient as the site's bt-gold-icon */
export const Icon: React.FC<{ name: IconName; size?: number; stroke?: string; width?: number }> = ({ name, size = 40, stroke, width = 2 }) => {
  const id = `gold-${name}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color.goldLight} />
          <stop offset="100%" stopColor={color.goldDark} />
        </linearGradient>
      </defs>
      {ICONS[name].map((d) => (
        <path key={d} d={d} stroke={stroke ?? `url(#${id})`} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
};

/* The icon tile from the landing's feature cards: a soft gold square with a ring */
export const IconTile: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 64 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(251,198,70,0.08)",
      boxShadow: "inset 0 0 0 1px rgba(251,198,70,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);

/* A bento card that pops in at a frame with a click */
export const FeatureCard: React.FC<{
  at: number;
  icon: React.ReactNode;
  title: string;
  line?: string;
  badge?: React.ReactNode;
  width?: number;
  height?: number;
  sfx?: boolean;
  /* Order in the deal, which picks the tilt; defaults to the timing */
  order?: number;
  /* The gold focus ring, 0 to 1 */
  ring?: number;
}> = ({ at, icon, title, line, badge, width = 400, height = 250, sfx = true, order, ring = 0 }) => {
  const frame = useCurrentFrame();
  const lit = Math.max(0, 1 - Math.max(0, frame - at) / 40);
  return (
    <div style={{ width, height, ...deal(frame, at, order ?? Math.round(at / 15), 200) }}>
      <Card
        radius={20}
        bezel
        sheenAt={at + sec(0.55)}
        ring={ring}
        style={{ width: width - 18, height: height - 18, padding: "24px 26px", boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 0 ${lit * 60}px rgba(251,198,70,${lit * 0.18})` }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <IconTile>{icon}</IconTile>
          {badge}
        </div>
        <div style={{ marginTop: line ? 26 : 30, fontFamily: display, fontWeight: 800, fontSize: line ? 33 : 38, letterSpacing: "-0.03em", color: color.zinc100, lineHeight: 1.1 }}>{title}</div>
        {line && <div style={{ marginTop: 10, fontFamily: body, fontSize: 21, lineHeight: 1.45, color: color.zinc400 }}>{line}</div>}
      </Card>
      {sfx && <Sfx at={at} name="tick" volume={0.5} />}
    </div>
  );
};

/* A number counting up to its value, in gold display type */
export const Counter: React.FC<{ to: number; from?: number; at: number; duration?: number; suffix?: string; prefix?: string; size?: number; decimals?: number }> = ({
  to,
  from = 0,
  at,
  duration = 60,
  suffix = "",
  prefix = "",
  size = 220,
  decimals = 0,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, duration, easeOut);
  const value = interpolate(p, [0, 1], [from, to]);
  return (
    <span style={{ fontFamily: display, fontWeight: 900, fontSize: size, letterSpacing: "-0.05em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
      <Gold>
        {prefix}
        {value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        {suffix}
      </Gold>
    </span>
  );
};

/* Logos that pop in one per step, each on its own tile with its name */
export const LogoRow: React.FC<{ logos: { name: string; label: string; size?: number }[]; at: number; step?: number; tile?: number; sfx?: boolean }> = ({
  logos,
  at,
  step = 8,
  tile = 150,
  sfx = true,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 34, justifyContent: "center" }}>
      {logos.map((l, i) => {
        const dealt = deal(frame, at + i * step, i, 160);
        return (
          <div key={l.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, ...dealt }}>
            <Card radius={tile * 0.22} bezel sheenAt={at + i * step + sec(0.5)} style={{ width: tile - 18, height: tile - 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Logo name={l.name} size={l.size ?? tile * 0.48} />
            </Card>
            <span style={{ fontFamily: body, fontWeight: 600, fontSize: 24, color: color.zinc300 }}>{l.label}</span>
            {sfx && <Sfx at={at + i * step} name="pop" volume={0.4} />}
          </div>
        );
      })}
    </div>
  );
};

export const Tag: React.FC<{ children: React.ReactNode; tone?: "gold" | "red" | "zinc" }> = ({ children, tone = "gold" }) => (
  <Chip tone={tone} size={16}>
    {children}
  </Chip>
);
