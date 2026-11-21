import Link from "@docusaurus/Link";
import { Highlighter, HighlighterItem } from "@site/src/components";
import { cn } from "@site/src/lib/utils";
import { Braces, Check, CloudOff, Laptop, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import React, { useEffect, useRef, useState } from "react";

import { fadeUp } from "../shared/section-header";

/*
 * "From schema to typed SDK" bento. A symmetric 2x2 of illustrated cards, then three compact cards.
 * Cards are solid, so the site's Highlighter spotlight lights only the 1px edge under the cursor.
 * Illustrations are live UI: no code editors, no screenshots.
 */

const ease = [0.21, 0.47, 0.32, 0.98] as const;

/* ── Shell ──────────────────────────────────────────────────────────────────────────────── */

const Tile = ({
  to,
  title,
  line,
  children,
  textTop = false,
  className,
  i = 0,
}: {
  to: string;
  title: string;
  line: string;
  children: React.ReactNode;
  textTop?: boolean;
  className?: string;
  i?: number;
}) => {
  const text = (
    <div className="relative z-10 px-7 py-6">
      <h3 className="!m-0 text-lg font-semibold tracking-tight text-zinc-100">
        {title}
      </h3>
      <p className="!mb-0 !mt-1.5 text-[15px] leading-relaxed text-zinc-400">
        {line}
      </p>
    </div>
  );
  return (
    <motion.div {...fadeUp(i)} className={cn("min-w-0", className)}>
      <Link to={to} className="block h-full !no-underline">
        <HighlighterItem className="!rounded-3xl">
          <div className="relative z-20 flex h-full flex-col overflow-hidden rounded-[inherit] bg-[#1f1f21] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {textTop && text}
            <div className="relative min-h-0 flex-1">{children}</div>
            {!textTop && text}
          </div>
        </HighlighterItem>
      </Link>
    </motion.div>
  );
};

const Panel = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "rounded-2xl bg-[#2a2a2d] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_40px_-20px_rgba(0,0,0,0.8)] ring-1 ring-inset ring-white/[0.06]",
      className,
    )}
  >
    {children}
  </div>
);

const useInViewRef = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -80px 0px" });
  return { ref, inView };
};

/* Steps through 0..steps-1 while on screen */
const useCycle = (steps: number, ms: number) => {
  const { ref, inView } = useInViewRef();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    const t = setTimeout(() => setStep((s) => (s + 1) % steps), ms);
    return () => clearTimeout(t);
  }, [inView, step, steps, ms]);
  return { ref, step, inView };
};

/* A fan of curves from one point on the left to `count` evenly spaced points on the right.
 * One glowing dot travels the curve for `active`, like the request dots in "Ship it". */
const bezier = (t: number, a: number, b: number, c: number, d: number) =>
  (1 - t) ** 3 * a +
  3 * (1 - t) ** 2 * t * b +
  3 * (1 - t) * t ** 2 * c +
  t ** 3 * d;

const Fan = ({
  count,
  active,
  originY = 50,
}: {
  count: number;
  active: number;
  originY?: number;
}) => {
  const ys = Array.from({ length: count }, (_, i) => ((i + 0.5) * 100) / count);
  const samples = Array.from({ length: 13 }, (_, k) => k / 12);
  const y = active >= 0 ? ys[active] : 0;
  return (
    <div className="relative h-full w-full" aria-hidden>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {ys.map((yi, i) => (
          <path
            key={i}
            d={`M0 ${originY} C 55 ${originY}, 45 ${yi}, 100 ${yi}`}
            fill="none"
            stroke={
              i === active ? "rgba(253,224,71,0.35)" : "rgba(255,255,255,0.10)"
            }
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            style={{ transition: "stroke 300ms" }}
          />
        ))}
      </svg>
      {active >= 0 && (
        <motion.span
          key={`dot-${active}`}
          className="absolute -ml-[3px] -mt-[3px] size-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_2px_rgba(250,204,21,0.75)]"
          initial={{ left: "0%", top: `${originY}%`, opacity: 0 }}
          animate={{
            left: samples.map((t) => `${bezier(t, 0, 55, 45, 100)}%`),
            top: samples.map((t) => `${bezier(t, originY, originY, y, y)}%`),
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 0.55,
            ease: "easeInOut",
            opacity: {
              duration: 0.55,
              times: [0, 0.1, 0.9, 1],
              ease: "linear",
            },
          }}
        />
      )}
    </div>
  );
};

/* ── 1. A typed SDK from your code: your API beams into endpoints ────────────────────────── */
const endpoints = [
  { m: "GET", c: "text-emerald-300 bg-emerald-400/10", path: "/users" },
  { m: "POST", c: "text-sky-300 bg-sky-400/10", path: "/users" },
  { m: "GET", c: "text-emerald-300 bg-emerald-400/10", path: "/users/:userId" },
  { m: "PATCH", c: "text-yellow-300 bg-yellow-400/10", path: "/users/:userId" },
  { m: "DELETE", c: "text-rose-300 bg-rose-400/10", path: "/users/:userId" },
];
const skeleton = [70, 45, 85, 55, 30, 75, 50, 65];

const GenerateIllustration = () => {
  // steps 0..4 beam into each endpoint, 5..7 hold with all generated
  const { ref, step } = useCycle(endpoints.length + 3, 650);
  const generated = Math.min(step + 1, endpoints.length);
  const beam = step < endpoints.length ? step : -1;
  return (
    <div ref={ref} className="flex h-full min-h-[290px] items-center px-7 pt-7">
      <Panel className="w-[34%] max-w-[210px] shrink-0 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Braces className="size-4 text-violet-300" />
          <span className="font-mono text-[11px] text-zinc-400">your API</span>
        </div>
        <div className="space-y-2">
          {skeleton.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5"
              style={{ paddingLeft: i % 3 === 0 ? 0 : 10 }}
            >
              <span
                className={cn(
                  "h-1.5 rounded-full",
                  i % 3 === 0 ? "bg-violet-300/40" : "bg-white/10",
                )}
                style={{ width: `${w}%` }}
              />
            </div>
          ))}
        </div>
      </Panel>
      <div className="h-[240px] min-w-[40px] flex-1">
        <Fan count={endpoints.length} active={beam} />
      </div>
      <div className="flex h-[240px] w-[44%] max-w-[260px] shrink-0 flex-col">
        {endpoints.map((e, i) => (
          <div key={`${e.m}${e.path}`} className="flex flex-1 items-center">
            <motion.div
              initial={false}
              animate={
                i < generated ? { opacity: 1, x: 0 } : { opacity: 0.25, x: -4 }
              }
              transition={{ duration: 0.3, ease }}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl bg-[#2a2a2d] px-2.5 py-2 ring-1 ring-inset transition-shadow duration-300",
                i === beam
                  ? "shadow-[0_0_24px_-6px_rgba(250,204,21,0.6)] ring-yellow-400/40"
                  : "ring-white/[0.06]",
              )}
            >
              <span
                className={cn(
                  "w-14 shrink-0 rounded-md py-0.5 text-center font-mono text-[10px] font-bold",
                  e.c,
                )}
              >
                {e.m}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-zinc-300">
                {e.path}
              </span>
              {i < generated && (
                <Check className="size-3.5 shrink-0 text-emerald-400" />
              )}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── 2. See every request: a live network waterfall ────────────────────────────────────── */
const traffic = [
  { m: "GET", path: "/users/42", s: "200", kind: "ok", start: 4, len: 38 },
  { m: "GET", path: "/users/42", s: "cache", kind: "cache", start: 10, len: 6 },
  { m: "POST", path: "/orders", s: "201", kind: "ok", start: 14, len: 52 },
  { m: "WS", path: "chat/general", s: "live", kind: "ws", start: 0, len: 100 },
  { m: "GET", path: "/posts?page=2", s: "200", kind: "ok", start: 30, len: 30 },
  {
    m: "PATCH",
    path: "/cart",
    s: "queued",
    kind: "queued",
    start: 48,
    len: 20,
  },
  { m: "GET", path: "/me", s: "deduped", kind: "cache", start: 22, len: 5 },
];
const barColor: Record<string, string> = {
  ok: "bg-emerald-400/70",
  cache: "bg-yellow-400/80",
  ws: "bg-sky-400/60",
  queued: "bg-zinc-500/70",
};
const chipColor: Record<string, string> = {
  ok: "text-emerald-300 bg-emerald-400/10",
  cache: "text-yellow-300 bg-yellow-400/10",
  ws: "text-sky-300 bg-sky-400/10",
  queued: "text-zinc-300 bg-white/[0.06]",
};

const NetworkIllustration = () => {
  const { ref, step } = useCycle(1000, 1100);
  const rows = Array.from({ length: 10 }, (_, k) => k).map((k) => ({
    key: step - k,
    ...traffic[
      (((step - k) % traffic.length) + traffic.length) % traffic.length
    ],
  }));
  return (
    <div ref={ref} className="relative h-full min-h-[290px]">
      <div className="absolute bottom-0 left-7 right-[-24px] top-1 overflow-hidden rounded-tl-2xl bg-[#18181a] ring-1 ring-white/[0.08] [mask-image:linear-gradient(180deg,#000_82%,transparent)]">
        <div className="flex h-10 items-center gap-4 border-0 border-b border-solid border-white/[0.06] px-4 text-[11px]">
          <span className="flex items-center gap-1.5 font-semibold text-zinc-100">
            <img
              src="/img/integration-hyper-fetch.svg"
              alt=""
              className="size-3.5"
            />{" "}
            Network
          </span>
          <span className="text-zinc-600">Cache</span>
          <span className="text-zinc-600">Queues</span>
          <span className="ml-auto flex items-center gap-1.5 text-zinc-500">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />{" "}
            live
          </span>
        </div>
        <div className="px-2 py-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map((r, i) => (
              <motion.div
                key={r.key}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3, ease }}
                className={cn(
                  "grid grid-cols-[52px_1fr_58px_90px] items-center gap-2 rounded-lg px-2 py-2",
                  i === 0 && "bg-white/[0.03]",
                )}
              >
                <span className="font-mono text-[10px] font-bold text-zinc-400">
                  {r.m}
                </span>
                <span className="truncate font-mono text-[11.5px] text-zinc-200">
                  {r.path}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-px text-center font-mono text-[10px]",
                    chipColor[r.kind],
                  )}
                >
                  {r.s}
                </span>
                <span className="relative h-1.5 rounded-full bg-white/[0.04]">
                  <motion.span
                    className={cn(
                      "absolute inset-y-0 rounded-full",
                      barColor[r.kind],
                    )}
                    style={{ left: `${r.start}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(r.len, 100 - r.start)}%` }}
                    transition={{ duration: 0.6, ease }}
                  />
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

/* ── 3. Runs everywhere: frameworks and runtimes orbit the core ────────────────────────── */
const OrbitRing = ({
  logos,
  radius,
  duration,
  reverse,
}: {
  logos: string[];
  radius: number;
  duration: number;
  reverse?: boolean;
}) => (
  <motion.div
    className="absolute left-1/2 top-1/2 size-0"
    animate={{ rotate: reverse ? -360 : 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear" }}
  >
    <span
      className="absolute rounded-full border border-dashed border-white/10"
      style={{
        width: radius * 2,
        height: radius * 2,
        left: -radius,
        top: -radius,
      }}
    />
    {logos.map((logo, i) => {
      const a = (i / logos.length) * Math.PI * 2;
      return (
        <motion.span
          key={logo}
          className="absolute flex size-11 items-center justify-center rounded-xl bg-[#2a2a2d] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-white/[0.08]"
          style={{
            left: Math.cos(a) * radius - 22,
            top: Math.sin(a) * radius - 22,
          }}
          animate={{ rotate: reverse ? 360 : -360 }}
          transition={{ duration, repeat: Infinity, ease: "linear" }}
        >
          <img
            src={`/img/integration-${logo}.svg`}
            alt=""
            className="size-5 object-contain"
          />
        </motion.span>
      );
    })}
  </motion.div>
);

const RuntimesIllustration = () => (
  <div className="relative h-[260px] overflow-hidden">
    <div className="absolute left-1/2 top-1/2 size-0">
      <div className="absolute -left-24 -top-24 size-48 rounded-full bg-yellow-500/15 blur-3xl" />
      <OrbitRing
        logos={["react", "next", "remix", "astro"]}
        radius={86}
        duration={40}
      />
      <OrbitRing
        logos={["node", "bun", "nest", "hono", "elysia", "sockets"]}
        radius={136}
        duration={60}
        reverse
      />
      <span className="absolute -left-8 -top-8 flex size-16 items-center justify-center rounded-2xl bg-[#26262a] shadow-[0_0_40px_-6px_rgba(250,204,21,0.55)] ring-1 ring-inset ring-yellow-400/40">
        <img src="/img/integration-hyper-fetch.svg" alt="" className="size-8" />
      </span>
    </div>
  </div>
);

/* ── 5. Instant UI: optimistic task list ───────────────────────────────────────────────── */
const tasks = [
  "Ship the landing page",
  "Record the HyperFlow demo",
  "Publish the release",
];

const OptimisticIllustration = () => {
  const { ref, inView } = useInViewRef();
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    const t = setTimeout(
      () => setDone((d) => (d + 1) % (tasks.length + 2)),
      done === tasks.length + 1 ? 1600 : 1000,
    );
    return () => clearTimeout(t);
  }, [inView, done]);
  return (
    <div ref={ref} className="flex h-[260px] items-center px-7 pt-6">
      <Panel className="w-full p-4">
        <div className="mb-2 flex items-center justify-between px-1.5 text-[12px] text-zinc-500">
          <span className="font-medium text-zinc-300">Tasks</span>
          <span className="tabular-nums">
            {Math.min(done, tasks.length)} of 3 done
          </span>
        </div>
        {tasks.map((t, i) => {
          const checked = i < done;
          const justNow = i === done - 1;
          return (
            <div
              key={t}
              className="flex items-center gap-3 rounded-lg px-1.5 py-3"
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md ring-1 ring-inset transition-colors duration-100",
                  checked ? "bg-yellow-400 ring-yellow-400" : "ring-white/25",
                )}
              >
                {checked && (
                  <Check className="size-3 text-zinc-900" strokeWidth={3} />
                )}
              </span>
              <span
                className={cn(
                  "flex-1 truncate text-[14px] transition-colors",
                  checked ? "text-zinc-500 line-through" : "text-zinc-200",
                )}
              >
                {t}
              </span>
              <span className="w-14 text-right font-mono text-[11px]">
                {justNow ? (
                  <span className="text-yellow-300">0ms</span>
                ) : checked ? (
                  <span className="text-emerald-400">synced</span>
                ) : null}
              </span>
            </div>
          );
        })}
      </Panel>
    </div>
  );
};

/* ── 6. Nothing lost offline: device, queue, cloud ─────────────────────────────────────── */
const OfflineIllustration = () => {
  const { ref, inView } = useInViewRef();
  const [phase, setPhase] = useState(0); // 0 offline, 1 replaying, 2 synced
  useEffect(() => {
    if (!inView) return undefined;
    const t = setTimeout(
      () => setPhase((p) => (p + 1) % 3),
      [1800, 900, 1600][phase],
    );
    return () => clearTimeout(t);
  }, [inView, phase]);
  return (
    <div
      ref={ref}
      className="flex h-[260px] flex-col items-center justify-center px-7 pt-6"
    >
      <div className="flex w-full items-center justify-center gap-4">
        <Panel className="flex size-20 items-center justify-center">
          <Laptop className="size-8 text-zinc-300" />
        </Panel>
        <div className="relative h-px w-24 border-0 border-t border-dashed border-white/20">
          {phase === 1 &&
            [0, 1, 2].map((d) => (
              <motion.span
                key={d}
                className="absolute -top-[3px] size-[5px] rounded-full bg-yellow-300 shadow-[0_0_8px_2px_rgba(250,204,21,0.6)]"
                initial={{ left: "0%", opacity: 0 }}
                animate={{ left: "100%", opacity: [0, 1, 0] }}
                transition={{ duration: 0.6, delay: d * 0.2 }}
              />
            ))}
        </div>
        <Panel className="flex size-20 items-center justify-center">
          {phase === 0 ? (
            <CloudOff className="size-8 text-zinc-500" />
          ) : (
            <img
              src="/img/integration-hyper-fetch.svg"
              alt=""
              className="size-8"
            />
          )}
        </Panel>
      </div>
      <Panel className="mt-6 flex w-full max-w-[300px] items-center justify-between px-5 py-3.5 text-[14px]">
        <span className="text-zinc-400">
          {phase === 0 ? "Offline queue" : phase === 1 ? "Replaying" : "Synced"}
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 font-mono",
            phase === 2 ? "text-emerald-300" : "text-zinc-200",
          )}
        >
          {phase === 1 && <Loader2 className="size-3 animate-spin" />}
          {phase === 2 && <Check className="size-3" />}
          {phase === 2 ? "3 sent" : "3 requests"}
        </span>
      </Panel>
    </div>
  );
};

/* ── Grid ───────────────────────────────────────────────────────────────────────────────── */

export const ProductionBento = () => (
  <div className="flex flex-col gap-4">
    <Highlighter className="grid gap-4 group lg:grid-cols-5">
      <Tile
        to="/docs/cli/commands/generate"
        title="A typed SDK from your code"
        line="From your types, your schema or your server. Every endpoint comes out typed."
        className="lg:col-span-3"
        i={0}
      >
        <GenerateIllustration />
      </Tile>
      <Tile
        to="/docs/hyper-flow/download"
        title="See every request"
        line="HyperFlow streams requests, cache hits and queues live."
        textTop
        className="lg:col-span-2"
        i={1}
      >
        <NetworkIllustration />
      </Tile>
    </Highlighter>
    <Highlighter className="grid gap-4 group md:grid-cols-3">
      <Tile
        to="/docs/getting-started"
        title="Runs everywhere"
        line="React, Next.js, Node, Bun and your server. One client."
        i={2}
      >
        <RuntimesIllustration />
      </Tile>
      <Tile
        to="/docs/react/overview"
        title="Instant UI"
        line="Optimistic updates. Rolls back on error."
        i={3}
      >
        <OptimisticIllustration />
      </Tile>
      <Tile
        to="/docs/core/overview"
        title="Nothing lost offline"
        line="Requests queue up and replay on reconnect."
        i={4}
      >
        <OfflineIllustration />
      </Tile>
    </Highlighter>
  </div>
);
