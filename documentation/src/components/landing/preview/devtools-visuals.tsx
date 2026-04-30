import React, { Fragment } from "react";

/* ─── Network Inspector — mini request log ───────────────────────── */

interface LogRow {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  status: number;
  time: string;
}

const networkLog: LogRow[] = [
  { method: "GET", path: "/users", status: 200, time: "142ms" },
  { method: "POST", path: "/users/42", status: 201, time: "89ms" },
  { method: "GET", path: "/posts/12", status: 304, time: "12ms" },
];

const methodTones: Record<LogRow["method"], string> = {
  GET: "text-emerald-300",
  POST: "text-violet-300",
  PUT: "text-amber-300",
  DELETE: "text-rose-300",
};

function statusTone(status: number) {
  if (status >= 500) return "text-rose-300";
  if (status >= 400) return "text-amber-300";
  if (status >= 300) return "text-sky-300";
  return "text-emerald-300";
}

export function NetworkLogVisual() {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 gap-y-1 font-mono text-[11px] leading-none">
      {networkLog.map((row) => (
        <Fragment key={`${row.method}-${row.path}`}>
          <span className={`whitespace-nowrap font-semibold ${methodTones[row.method]}`}>{row.method}</span>
          <span className="min-w-0 truncate text-zinc-300">{row.path}</span>
          <span className={`whitespace-nowrap tabular-nums ${statusTone(row.status)}`}>{row.status}</span>
          <span className="whitespace-nowrap tabular-nums text-zinc-500">{row.time}</span>
        </Fragment>
      ))}
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

/* ─── Queue Manager — flow rows ──────────────────────────────────── */

interface QueueRow {
  label: string;
  count: number;
  dots: number;
  dotClass: string;
  pulseAt?: number;
}

const queueRows: QueueRow[] = [
  { label: "In-flight", count: 2, dots: 2, dotClass: "bg-amber-400", pulseAt: 1 },
  { label: "Pending", count: 5, dots: 5, dotClass: "bg-white/20" },
  { label: "Done", count: 128, dots: 8, dotClass: "bg-emerald-400/50" },
];

export function QueueFlowVisual() {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5 font-mono text-[11px] leading-none">
      {queueRows.map((row) => (
        <Fragment key={row.label}>
          <span className="whitespace-nowrap text-zinc-500">{row.label}</span>
          <div className="flex gap-1">
            {Array.from({ length: row.dots }).map((_, i) => (
              <span
                key={`${row.label}-${i.toString()}`}
                className={`size-1.5 rounded-full ${row.dotClass} ${row.pulseAt === i ? "animate-pulse" : ""}`}
              />
            ))}
          </div>
          <span className="whitespace-nowrap tabular-nums text-zinc-500">{row.count}</span>
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
