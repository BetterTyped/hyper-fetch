import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { deal, easeInOut, outQuint, pop, progress, sec } from "../brand/motion";
import { body, color, mono } from "../brand/tokens";
import { Sfx } from "../brand/Sfx";
import { Card, Chip } from "../brand/ui";

/*
 * Small pieces of product UI the scenes animate: an app panel with rows, event pills that fly in, a status dot and
 * a value that flashes gold when it changes.
 */

export const Panel: React.FC<{
  title: React.ReactNode;
  badge?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ title, badge, width = 560, children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width, ...deal(frame, delay, Math.round(delay / 7), 180), ...style }}>
      <Card radius={22} bezel sheenAt={delay + sec(0.6)} style={{ padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 16 }}>
          <div style={{ fontFamily: body, fontWeight: 600, fontSize: 25, color: color.zinc200 }}>{title}</div>
          {badge}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
      </Card>
    </div>
  );
};

export type RowState = "idle" | "flash" | "stale" | "pending" | "error";

export const Row: React.FC<{
  label: React.ReactNode;
  value?: React.ReactNode;
  enterAt?: number;
  exitAt?: number;
  flashAt?: number;
  state?: RowState;
  mono?: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, enterAt, exitAt, flashAt, state = "idle", mono: isMono, icon }) => {
  const frame = useCurrentFrame();
  const enter = enterAt === undefined ? 1 : pop(frame, enterAt, 16);
  const exit = exitAt === undefined ? 0 : progress(frame, exitAt, sec(0.45));
  const flash = flashAt === undefined ? 0 : Math.max(0, 1 - Math.abs(frame - flashAt - 8) / 30) * (frame >= flashAt ? 1 : 0);
  const h = 64 * Math.min(1, enter) * (1 - exit);
  const tint =
    state === "stale"
      ? "rgba(244,63,94,0.07)"
      : state === "error"
        ? "rgba(244,63,94,0.12)"
        : state === "pending"
          ? "rgba(251,198,70,0.06)"
          : "rgba(255,255,255,0.03)";
  return (
    <div
      style={{
        height: h,
        marginBottom: h < 1 ? -10 : 0,
        opacity: Math.min(1, enter) * (1 - exit),
        overflow: "hidden",
      }}
    >
      {/* The slide happens inside the row's own clipped box, so it never counts as the card overflowing */}
      <div
        style={{
          transform: `translateX(${(1 - Math.min(1, enter)) * 40 + exit * -40}px)`,
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 20px",
          borderRadius: 14,
          background: tint,
          boxShadow: `inset 0 0 0 1px ${flash > 0 ? `rgba(251,198,70,${0.15 + flash * 0.6})` : "rgba(255,255,255,0.06)"}, 0 0 ${flash * 40}px rgba(251,198,70,${flash * 0.35})`,
          fontFamily: isMono ? mono : body,
          fontSize: isMono ? 22 : 24,
          color: color.zinc200,
        }}
      >
        {icon}
        <span data-fit="row" style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        {value}
      </div>
    </div>
  );
};

/* Text that swaps at a frame with a quick gold flash */
export const Swap: React.FC<{ from: React.ReactNode; to: React.ReactNode; at: number; back?: number; backTo?: React.ReactNode }> = ({
  from,
  to,
  at,
  back,
  backTo,
}) => {
  const frame = useCurrentFrame();
  const showTo = frame >= at && (back === undefined || frame < back);
  const node = frame < at ? from : showTo ? to : (backTo ?? from);
  const since = frame >= at ? frame - (back !== undefined && frame >= back ? back : at) : 99;
  const k = Math.max(0, 1 - since / 20);
  return (
    <span style={{ display: "inline-block", transform: `translateY(${k * -6}px)`, filter: k > 0 ? `drop-shadow(0 0 ${k * 14}px rgba(251,198,70,0.9))` : undefined }}>
      {node}
    </span>
  );
};

/* A message flying in from the side, like a socket event */
export const EventPill: React.FC<{
  children: React.ReactNode;
  at: number;
  fromX?: number;
  toX?: number;
  y?: number;
  tone?: "gold" | "zinc" | "red" | "green" | "blue";
  travel?: number;
}> = ({ children, at, fromX = 300, toX = 0, y = 0, tone = "gold", travel = sec(0.55) }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = progress(frame, at, travel);
  const fade = progress(frame, at + travel + sec(0.15), sec(0.3));
  const x = interpolate(p, [0, 1], [fromX, toX]);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: Math.min(p * 3, 1) * (1 - fade), transform: `scale(${1 - fade * 0.3})` }}>
      <Chip tone={tone} size={21}>
        {children}
      </Chip>
    </div>
  );
};

export const StatusDot: React.FC<{ tone: "green" | "gold" | "red" | "zinc" }> = ({ tone }) => {
  /* Static on purpose: nothing on screen pulses or loops after it lands */
  const c = tone === "green" ? color.green : tone === "gold" ? color.bolt : tone === "red" ? color.red : color.zinc500;
  return (
    <span style={{ position: "relative", width: 12, height: 12, display: "inline-block" }}>
      <span style={{ position: "absolute", inset: -4, borderRadius: 99, background: c, opacity: 0.18 }} />
      <span style={{ position: "absolute", inset: 0, borderRadius: 99, background: c, boxShadow: `0 0 10px ${c}` }} />
    </span>
  );
};

/*
 * A cable between two cards: it draws itself in as an S-curve with horizontal tangents, has a port at each end,
 * sends one glowing packet with a comet tail at `at`, and stays softly lit gold once the packet has arrived.
 * `curve` and `dim` are kept for callers; `drawAt` is when the cable draws in (default 45 frames before `at`).
 */
export const Beam: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  at: number;
  duration?: number;
  curve?: number;
  dim?: number;
  drawAt?: number;
  /*
   * Which way the cable leaves and enters its cards: "horizontal" from a side edge to a side edge, "vertical" from a
   * bottom edge to a top edge. "auto" follows the longer axis. Pick it from the card edges the ports sit on; a cable
   * whose tangents fight its direction curls into loops.
   */
  orient?: "auto" | "horizontal" | "vertical";
}> = ({ x1, y1, x2, y2, at, duration = sec(0.55), curve = 0, dim = 0.2, drawAt, orient = "auto" }) => {
  const frame = useCurrentFrame();
  const id = `beam-${Math.round(x1)}-${Math.round(y1)}-${Math.round(x2)}-${Math.round(y2)}`;
  const vertical = orient === "vertical" || (orient === "auto" && Math.abs(y2 - y1) > Math.abs(x2 - x1));
  const d = vertical
    ? (() => {
        const dy = Math.max(40, Math.abs(y2 - y1) * 0.6) * Math.sign(y2 - y1 || 1);
        return `M ${x1} ${y1} C ${x1 + curve * 0.2} ${y1 + dy}, ${x2 - curve * 0.2} ${y2 - dy}, ${x2} ${y2}`;
      })()
    : (() => {
        const dx = Math.max(40, Math.abs(x2 - x1) * 0.55) * Math.sign(x2 - x1 || 1);
        return `M ${x1} ${y1} C ${x1 + dx} ${y1 - curve * 0.2}, ${x2 - dx} ${y2 + curve * 0.2}, ${x2} ${y2}`;
      })();
  const draw = progress(frame, drawAt ?? Math.max(0, at - 45), sec(0.6), outQuint);
  const p = progress(frame, at, duration, easeInOut);
  const flying = frame >= at && p < 1;
  const arrived = frame >= at + duration;
  const afterglow = arrived ? Math.max(0.35, 1 - (frame - at - duration) / 40) : 0;
  const head = p * 1.18;
  const seg = (len: number, lag: number) => ({
    strokeDasharray: `${len} ${2}`,
    strokeDashoffset: -(head - lag - len),
  });
  const port = (x: number, y: number, lit: number) => (
    <g opacity={draw}>
      <circle cx={x} cy={y} r={11} fill={`rgba(251,198,70,${0.12 * lit})`} />
      <circle data-beam-end cx={x} cy={y} r={5.5} fill={color.page} stroke={lit > 0 ? `rgba(251,198,70,${0.5 + 0.5 * lit})` : "rgba(161,161,170,0.55)"} strokeWidth={2} />
      {lit > 0 && <circle cx={x} cy={y} r={2.4} fill={color.bolt} opacity={lit} />}
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-track`} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="100%" stopColor="rgba(251,198,70,0.32)" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {/* The cable */}
      <path data-beam-track d={d} pathLength={1} stroke={`url(#${id}-track)`} strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={0.55 + dim} />
      {/* Lit once the packet has gone through */}
      {arrived && <path d={d} stroke={color.bolt} strokeWidth={2} fill="none" opacity={afterglow * 0.55} />}
      {arrived && <path d={d} stroke={color.goldDark} strokeWidth={8} fill="none" opacity={afterglow * 0.12} filter={`url(#${id}-glow)`} />}
      {/* The packet: a blurred halo, a gold tail and a bright head */}
      {flying && (
        <>
          <path d={d} pathLength={1} stroke={color.goldDark} strokeWidth={12} fill="none" strokeLinecap="round" filter={`url(#${id}-glow)`} opacity={0.7} {...seg(0.14, 0)} />
          <path d={d} pathLength={1} stroke={color.bolt} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.65} {...seg(0.16, 0.01)} />
          <path d={d} pathLength={1} stroke="#fff4d6" strokeWidth={4} fill="none" strokeLinecap="round" {...seg(0.025, 0)} />
        </>
      )}
      {port(x1, y1, frame >= at ? Math.max(0.4, 1 - (frame - at) / 30) : 0)}
      {port(x2, y2, arrived ? afterglow : 0)}
    </g>
  );
};

export const Mono: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color: c = color.zinc300, size = 22 }) => (
  <span style={{ fontFamily: mono, fontSize: size, color: c }}>{children}</span>
);

/* Soft key clicks while code types itself in, matched to the CodeWindow's typing speed */
export const TypingSfx: React.FC<{ from: number; chars: number; cps: number; every?: number; volume?: number }> = ({ from, chars, cps, every = 5, volume = 0.22 }) => {
  const end = from + (chars / cps) * 60;
  const clicks: number[] = [];
  for (let f = from; f < end; f += every) clicks.push(f);
  return (
    <>
      {clicks.map((f, i) => (
        <Sfx key={f} at={f} name="type" volume={volume * (0.7 + ((i * 37) % 10) / 30)} />
      ))}
    </>
  );
};
