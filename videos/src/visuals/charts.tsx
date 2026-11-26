import React from "react";
import { useCurrentFrame } from "remotion";

import { deal, easeInOut, outQuint, pop, progress, sec } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { body, clipText, color, display, goldGradient, mono } from "../brand/tokens";
import { Card, Logo } from "../brand/ui";

/*
 * Charts in the spirit of react-wrapped's gallery (spark, rings, dumbbell, bars), drawn in the landing's look: gold
 * strokes and fills, zinc rules, Inter labels, JetBrains Mono values. Each one builds itself on the beat from `at`.
 * Feed them measured numbers only, and keep the method next to the data.
 */

const fmt = (n: number, decimals = 0) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/* ---------------------------------------------------------------------------------------------------------- spark */

export type SparkPoint = { label: string; value: number };

/* An area chart that draws itself left to right; the points pop as the line reaches them, the last one is lit */
export const Spark: React.FC<{ points: SparkPoint[]; at: number; width?: number; height?: number; duration?: number; unit?: string }> = ({
  points,
  at,
  width = 1300,
  height = 380,
  duration = sec(2.4),
  unit = "",
}) => {
  const frame = useCurrentFrame();
  const pad = { l: 20, r: 20, t: 60, b: 56 };
  const max = Math.max(...points.map((p) => p.value)) * 1.08;
  const x = (i: number) => pad.l + (i / (points.length - 1)) * (width - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (height - pad.t - pad.b);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const area = `${line} L ${x(points.length - 1)} ${height - pad.b} L ${x(0)} ${height - pad.b} Z`;
  const p = progress(frame, at, duration, easeInOut);
  const reveal = pad.l + p * (width - pad.l - pad.r);
  const last = points.length - 1;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(251,198,70,0.32)" />
          <stop offset="100%" stopColor="rgba(251,198,70,0)" />
        </linearGradient>
        <linearGradient id="spark-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a16207" />
          <stop offset="100%" stopColor={color.goldLight} />
        </linearGradient>
        <clipPath id="spark-reveal">
          <rect x={0} y={0} width={reveal} height={height} />
        </clipPath>
        <filter id="spark-glow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <line key={k} x1={pad.l} x2={width - pad.r} y1={y(max * k)} y2={y(max * k)} stroke="rgba(255,255,255,0.06)" strokeDasharray="0" />
      ))}
      <line x1={pad.l} x2={width - pad.r} y1={height - pad.b} y2={height - pad.b} stroke="rgba(255,255,255,0.14)" />
      <g clipPath="url(#spark-reveal)">
        <path d={area} fill="url(#spark-fill)" />
        <path d={line} fill="none" stroke={color.goldDark} strokeWidth={10} opacity={0.35} filter="url(#spark-glow)" />
        <path d={line} fill="none" stroke="url(#spark-line)" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      </g>
      {points.map((pt, i) => {
        const reachAt = at + (x(i) - pad.l) / (width - pad.l - pad.r) * duration;
        const s = pop(frame, reachAt, 14);
        const isLast = i === last;
        return (
          <g key={pt.label} opacity={Math.min(1, s)}>
            <circle cx={x(i)} cy={y(pt.value)} r={(isLast ? 9 : 6) * s} fill={isLast ? color.goldLight : color.page} stroke={color.bolt} strokeWidth={3} />
            {isLast && <circle cx={x(i)} cy={y(pt.value)} r={22 * s} fill="rgba(251,198,70,0.15)" />}
            <text x={x(i)} y={height - pad.b + 34} textAnchor="middle" fill={isLast ? color.zinc200 : color.zinc500} style={{ fontFamily: mono, fontSize: 19 }}>
              {pt.label}
            </text>
            {(isLast || i === 0) && (
              <text x={x(i)} y={y(pt.value) - 22} textAnchor={isLast ? "end" : "start"} fill={isLast ? color.goldLight : color.zinc400} style={{ fontFamily: mono, fontSize: isLast ? 28 : 22, fontWeight: 700 }}>
                {fmt(pt.value)}
                {unit}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------------------------------------------------- rings */

export type RingItem = { logo: string; label: string; value: number; decimals?: number };

/* Progress rings, one per item, sweeping to their share with the number counting up in the middle */
export const Rings: React.FC<{ items: RingItem[]; at: number; size?: number; step?: number; unit?: string }> = ({
  items,
  at,
  size = 300,
  step = 12,
  unit = "%",
}) => {
  const frame = useCurrentFrame();
  const stroke = size * 0.075;
  const r = size / 2 - stroke;
  const len = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", gap: size * 0.22 }}>
      {items.map((item, i) => {
        const start = at + i * step;
        const p = progress(frame, start, sec(1.3), outQuint);
        const value = item.value * p;
        return (
          <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, ...deal(frame, start - 10, i, 120) }}>
            <div style={{ position: "relative", width: size, height: size }}>
              <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <defs>
                  <linearGradient id={`ring-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color.goldLight} />
                    <stop offset="100%" stopColor={color.goldDark} />
                  </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={`url(#ring-${i})`}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${len * (value / 100)} ${len}`}
                  style={{ filter: "drop-shadow(0 0 10px rgba(245,166,35,0.45))" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Logo name={item.logo} size={size * 0.15} />
                <span style={{ fontFamily: display, fontWeight: 800, fontSize: size * 0.2, letterSpacing: "-0.04em", ...clipText(goldGradient), lineHeight: 1 }}>
                  {fmt(value, item.decimals ?? 0)}
                  {unit}
                </span>
              </div>
            </div>
            <span style={{ fontFamily: body, fontWeight: 600, fontSize: 26, color: color.zinc200 }}>{item.label}</span>
            <Sfx at={start} name="tick" volume={0.45} />
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------------------------------------------- dumbbell */

export type DumbbellRow = { logo: string; label: string; was: number; now: number };

/* Before and after per row: the dot starts at "was" and slides to "now", leaving a gold bar behind it */
export const Dumbbell: React.FC<{ rows: DumbbellRow[]; at: number; width?: number; step?: number; wasLabel?: string; nowLabel?: string }> = ({
  rows,
  at,
  width = 1300,
  step = 12,
  wasLabel = "before",
  nowLabel = "now",
}) => {
  const frame = useCurrentFrame();
  const labelW = 260;
  const valueW = 140;
  const track = width - labelW - valueW;
  const max = Math.max(...rows.map((r) => Math.max(r.was, r.now)));
  const x = (v: number) => (v / max) * track;
  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "flex", paddingLeft: labelW, gap: 30, fontFamily: mono, fontSize: 19, color: color.zinc500 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 14, height: 14, borderRadius: 99, boxShadow: `inset 0 0 0 3px ${color.zinc500}` }} />
          {wasLabel}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color: color.bolt }}>
          <span style={{ width: 14, height: 14, borderRadius: 99, background: color.bolt }} />
          {nowLabel}
        </span>
      </div>
      {rows.map((row, i) => {
        const start = at + i * step;
        const appear = progress(frame, start - 12, sec(0.4), outQuint);
        const p = progress(frame, start, sec(1.1), outQuint);
        const v = row.was + (row.now - row.was) * p;
        return (
          <div key={row.label} style={{ display: "flex", alignItems: "center", height: 56, opacity: appear, transform: `translateX(${(1 - appear) * -30}px)` }}>
            <div style={{ width: labelW, display: "flex", alignItems: "center", gap: 14 }}>
              <Logo name={row.logo} size={32} />
              <span style={{ fontFamily: body, fontWeight: 600, fontSize: 26, color: color.zinc200 }}>{row.label}</span>
            </div>
            <div style={{ position: "relative", width: track, height: 56 }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 27, height: 2, background: "rgba(255,255,255,0.06)" }} />
              <div
                style={{
                  position: "absolute",
                  left: x(row.was),
                  width: Math.max(0, x(v) - x(row.was)),
                  top: 22,
                  height: 12,
                  borderRadius: 99,
                  background: "linear-gradient(to right, rgba(251,198,70,0.25), rgba(251,198,70,0.85))",
                  boxShadow: "0 0 18px rgba(245,166,35,0.45)",
                }}
              />
              <div style={{ position: "absolute", left: x(row.was) - 9, top: 19, width: 18, height: 18, borderRadius: 99, background: color.page, boxShadow: `inset 0 0 0 3px ${color.zinc500}` }} />
              <div style={{ position: "absolute", left: x(v) - 12, top: 16, width: 24, height: 24, borderRadius: 99, background: color.bolt, boxShadow: "0 0 18px rgba(251,198,70,0.8)" }} />
            </div>
            <div style={{ width: valueW, textAlign: "right", fontFamily: mono, fontSize: 28, fontWeight: 700, color: color.goldLight }}>{fmt(v)}</div>
            <Sfx at={start} name="swish" volume={0.3} />
          </div>
        );
      })}
    </div>
  );
};

/* ----------------------------------------------------------------------------------------------------------- bars */

export type BarItem = { logo?: string; label: string; value: number };

/* Vertical bars growing to their values in turn, the value counting up on top of each */
export const Bars: React.FC<{ items: BarItem[]; at: number; width?: number; height?: number; step?: number; unit?: string }> = ({
  items,
  at,
  width = 1200,
  height = 420,
  step = 8,
  unit = "",
}) => {
  const frame = useCurrentFrame();
  const max = Math.max(...items.map((b) => b.value));
  const gap = 40;
  const barW = (width - gap * (items.length - 1)) / items.length;
  return (
    <div style={{ width, display: "flex", alignItems: "flex-end", gap, height: height + 90 }}>
      {items.map((b, i) => {
        const start = at + i * step;
        const p = progress(frame, start, sec(0.9), outQuint);
        const h = (b.value / max) * height * p;
        return (
          <div key={b.label} style={{ width: barW, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 28, color: color.goldLight, opacity: p }}>
              {fmt(b.value * p)}
              {unit}
            </span>
            <div
              style={{
                width: "100%",
                height: h,
                borderRadius: "16px 16px 6px 6px",
                background: "linear-gradient(to top, rgba(245,166,35,0.35), rgba(255,224,138,0.95))",
                boxShadow: "0 0 30px -6px rgba(245,166,35,0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: body, fontWeight: 600, fontSize: 24, color: color.zinc300, whiteSpace: "nowrap" }}>
              {b.logo && <Logo name={b.logo} size={28} />}
              {b.label}
            </span>
            <Sfx at={start} name="tick" volume={0.4} />
          </div>
        );
      })}
    </div>
  );
};

/* A chart in a quiet card, for when it needs a frame */
export const ChartCard: React.FC<{ children: React.ReactNode; at: number; title?: string; padding?: number }> = ({ children, at, title, padding = 40 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={deal(frame, at, 2, 160)}>
      <Card radius={28} bezel sheenAt={at + 40} style={{ padding }}>
        {title && <div style={{ fontFamily: mono, fontSize: 20, color: color.zinc500, marginBottom: 20 }}>{title}</div>}
        {children}
      </Card>
    </div>
  );
};

