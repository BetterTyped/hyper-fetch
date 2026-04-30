import React, { Fragment } from "react";

/* ─── Network Inspector — request log with timing bars ───────────── */

interface LogRow {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  status: number;
  time: number;
}

const networkLog: LogRow[] = [
  { method: "GET", path: "/users", status: 200, time: 142 },
  { method: "POST", path: "/users/42", status: 201, time: 89 },
  { method: "GET", path: "/posts/12", status: 304, time: 12 },
];

const methodBadgeTones: Record<LogRow["method"], string> = {
  GET: "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300",
  POST: "border-violet-400/30 bg-violet-400/[0.08] text-violet-300",
  PUT: "border-amber-400/30 bg-amber-400/[0.08] text-amber-300",
  DELETE: "border-rose-400/30 bg-rose-400/[0.08] text-rose-300",
};

function statusTone(status: number) {
  if (status >= 500) return "text-rose-300";
  if (status >= 400) return "text-amber-300";
  if (status >= 300) return "text-sky-300";
  return "text-emerald-300";
}

function timingBarTone(time: number) {
  if (time > 150) return "bg-amber-400/70";
  if (time > 60) return "bg-emerald-400/70";
  return "bg-sky-400/70";
}

const TIMING_CAP = 180;

export function NetworkLogVisual() {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-2.5 gap-y-2 font-mono text-[11px] leading-none">
      {networkLog.map((row) => {
        const widthPct = Math.min(100, (row.time / TIMING_CAP) * 100);
        return (
          <Fragment key={`${row.method}-${row.path}`}>
            <span
              className={`whitespace-nowrap rounded border px-1.5 py-1 text-[10px] font-bold uppercase leading-none ${methodBadgeTones[row.method]}`}
            >
              {row.method}
            </span>
            <span className="min-w-0 truncate text-zinc-300">{row.path}</span>
            <span className={`whitespace-nowrap tabular-nums font-semibold ${statusTone(row.status)}`}>
              {row.status}
            </span>
            <div className="h-1 w-14 overflow-hidden rounded-full bg-white/[0.06]">
              <div style={{ width: `${widthPct}%` }} className={`h-full rounded-full ${timingBarTone(row.time)}`} />
            </div>
            <span className="whitespace-nowrap tabular-nums text-zinc-500">{row.time}ms</span>
          </Fragment>
        );
      })}
    </div>
  );
}

/* ─── Cache Inspector — hit rate bar ─────────────────────────────── */

export function CacheHitRateVisual() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-mono text-zinc-500">Hit rate</span>
        <span className="font-mono font-semibold text-emerald-300 tabular-nums">94%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-emerald-500/40 to-emerald-400" />
      </div>
      <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
        <span>
          <span className="text-emerald-300/80">412</span> hits
        </span>
        <span>
          <span className="text-zinc-300/80">26</span> misses
        </span>
        <span>
          <span className="text-zinc-300/80">38</span> entries
        </span>
      </div>
    </div>
  );
}

/* ─── Queue Manager — chip rows ──────────────────────────────────── */

interface QueueRow {
  label: string;
  count: number;
  chips: number;
  chipClass: string;
  dotClass: string;
  pulseAt?: number;
}

const queueRows: QueueRow[] = [
  {
    label: "In-flight",
    count: 2,
    chips: 2,
    chipClass: "bg-gradient-to-b from-amber-400 to-amber-500 shadow-[0_0_6px_rgba(251,191,36,0.45)]",
    dotClass: "bg-amber-400",
    pulseAt: 1,
  },
  {
    label: "Pending",
    count: 5,
    chips: 5,
    chipClass: "bg-white/[0.04] border border-white/[0.12]",
    dotClass: "bg-white/30",
  },
  {
    label: "Done",
    count: 128,
    chips: 8,
    chipClass: "bg-gradient-to-b from-emerald-500/50 to-emerald-600/40",
    dotClass: "bg-emerald-400/70",
  },
];

export function QueueFlowVisual() {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-6 gap-y-4 font-mono text-[11px] leading-none">
      {queueRows.map((row) => (
        <Fragment key={row.label}>
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-zinc-400">
            <span className={`size-1.5 rounded-full ${row.dotClass}`} />
            {row.label}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: row.chips }).map((_, i) => (
              <span
                key={`${row.label}-${i.toString()}`}
                className={`h-3 w-3.5 rounded-[3px] ${row.chipClass} ${row.pulseAt === i ? "animate-pulse" : ""}`}
              />
            ))}
          </div>
          <span className="whitespace-nowrap tabular-nums text-zinc-400">{row.count}</span>
        </Fragment>
      ))}
    </div>
  );
}

/* ─── Performance Dashboard — sparkline bars ─────────────────────── */

const bars = [22, 38, 30, 55, 44, 68, 52, 80, 64, 92, 70, 88];

export function MetricsSparklineVisual() {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between font-mono text-[11px]">
        <span className="text-zinc-500">Throughput</span>
        <span className="font-semibold text-zinc-200 tabular-nums">
          1.4k <span className="text-zinc-500">req/s</span>
        </span>
      </div>
      <div className="flex h-10 items-end gap-1">
        {bars.map((h, i) => {
          const topAlpha = 0.25 + (h / 100) * 0.75;
          return (
            <div
              key={`b-${i.toString()}`}
              style={{
                height: `${h}%`,
                background: `linear-gradient(to top, rgba(217, 119, 6, 0.25), rgba(252, 211, 77, ${topAlpha}))`,
              }}
              className="flex-1 rounded-sm"
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
        <span>
          p50 <span className="text-zinc-300/80">42ms</span>
        </span>
        <span>
          p95 <span className="text-zinc-300/80">118ms</span>
        </span>
        <span>
          p99 <span className="text-amber-300/80">312ms</span>
        </span>
      </div>
    </div>
  );
}
