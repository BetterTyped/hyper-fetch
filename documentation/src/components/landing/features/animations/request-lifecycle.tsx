import { cn } from "@site/src/lib/utils";
import { Boxes, Check, Database, Globe, Layers, Repeat, WifiOff } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

/* ─── Pipeline Nodes ─────────────────────────────────────────────── */

interface PipelineNode {
  id: string;
  label: string;
  icon: React.ElementType;
}

const nodes: PipelineNode[] = [
  { id: "hook", label: "useFetch()", icon: Boxes },
  { id: "cache", label: "Cache", icon: Database },
  { id: "queue", label: "Queue", icon: Layers },
  { id: "adapter", label: "Adapter", icon: Repeat },
  { id: "server", label: "Server", icon: Globe },
];

type Tone = "amber" | "emerald" | "rose" | "violet";

interface Badge {
  text: string;
  tone: Tone;
}

const toneStyles: Record<Tone, { text: string; bg: string; dot: string; border: string; ring: string }> = {
  amber: {
    text: "text-amber-300",
    bg: "bg-amber-400/10",
    dot: "bg-amber-400",
    border: "border-amber-400/60",
    ring: "ring-amber-400/30",
  },
  emerald: {
    text: "text-emerald-300",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
    border: "border-emerald-400/60",
    ring: "ring-emerald-400/30",
  },
  rose: {
    text: "text-rose-300",
    bg: "bg-rose-400/10",
    dot: "bg-rose-400",
    border: "border-rose-400/60",
    ring: "ring-rose-400/30",
  },
  violet: {
    text: "text-violet-300",
    bg: "bg-violet-400/10",
    dot: "bg-violet-400",
    border: "border-violet-400/60",
    ring: "ring-violet-400/30",
  },
};

/* ─── Phases (each phase = one sequential step) ──────────────────── */

interface Pulse {
  /** Index of the connector segment between nodes[i] and nodes[i+1] */
  connector: number;
  /** Reverse direction (downstream → upstream). Default false. */
  reverse?: boolean;
}

interface DynamicBadge {
  node: string;
  values: Badge[];
  interval: number;
}

interface Phase {
  /** Pulses fired in sequence. Each pulse staggered by `pulseStagger`. */
  pulses: Pulse[];
  /** Stagger between sequential pulses (ms). Default 380. */
  pulseStagger?: number;
  /** Index of node that lights up. null = nothing active */
  active: number | null;
  /** Tone for the active node ring/glow + pulse color */
  activeTone: Tone;
  /** Static per-node badges that persist for the phase */
  badges: Partial<Record<string, Badge>>;
  status: { text: string; tone: Tone };
  online: boolean;
  duration: number;
  /** Optional: animate one or more badges through a sequence of values during the phase. */
  dynamicBadges?: DynamicBadge[];
}

const DEFAULT_STAGGER = 380;

const phases: Phase[] = [
  // ── Story 1: cache HIT
  {
    pulses: [{ connector: 0 }],
    active: 1,
    activeTone: "emerald",
    badges: { cache: { text: "HIT", tone: "emerald" } },
    status: { text: "cache HIT · instant", tone: "emerald" },
    online: true,
    duration: 1500,
  },
  // ── Story 2: deduplication — 3 callers, all miss cache
  {
    pulses: [{ connector: 0 }, { connector: 0 }, { connector: 0 }],
    pulseStagger: 480,
    active: 1,
    activeTone: "amber",
    badges: {},
    dynamicBadges: [
      {
        node: "cache",
        values: [
          { text: "miss ×1", tone: "amber" },
          { text: "miss ×2", tone: "amber" },
          { text: "miss ×3", tone: "amber" },
        ],
        interval: 480,
      },
    ],
    status: { text: "3 callers · all cache miss", tone: "amber" },
    online: true,
    duration: 2100,
  },
  // ── Story 2b: queue dedupes the 3 misses into 1 pending call
  {
    pulses: [{ connector: 1 }, { connector: 1 }, { connector: 1 }],
    pulseStagger: 480,
    active: 2,
    activeTone: "amber",
    badges: { cache: { text: "miss ×3", tone: "amber" } },
    dynamicBadges: [
      {
        node: "queue",
        values: [
          { text: "dedupe ×1", tone: "amber" },
          { text: "dedupe ×2", tone: "amber" },
          { text: "dedupe ×3", tone: "amber" },
        ],
        interval: 480,
      },
    ],
    status: { text: "3 → 1 · queue dedupes", tone: "amber" },
    online: true,
    duration: 2100,
  },
  // ── Story 2c: queue → adapter, server fails
  {
    pulses: [{ connector: 2 }],
    active: 3,
    activeTone: "rose",
    badges: {
      cache: { text: "miss ×3", tone: "amber" },
      queue: { text: "×3", tone: "amber" },
      adapter: { text: "500", tone: "rose" },
    },
    status: { text: "500 server error", tone: "rose" },
    online: true,
    duration: 1200,
  },
  // ── Story 2d: adapter sends back to queue → Retry
  {
    pulses: [{ connector: 2, reverse: true }],
    active: 2,
    activeTone: "violet",
    badges: {
      cache: { text: "miss ×3", tone: "amber" },
      queue: { text: "retry", tone: "violet" },
      adapter: { text: "500", tone: "rose" },
    },
    status: { text: "retrying…", tone: "violet" },
    online: true,
    duration: 1200,
  },
  // ── Story 2e: queue → adapter (resend), wait a beat at the adapter
  {
    pulses: [{ connector: 2 }],
    active: 3,
    activeTone: "amber",
    badges: {
      cache: { text: "miss ×3", tone: "amber" },
      queue: { text: "×3", tone: "amber" },
      adapter: { text: "resend", tone: "amber" },
    },
    status: { text: "retry · sending", tone: "amber" },
    online: true,
    duration: 1300,
  },
  // ── Story 2f: adapter → server, success, all 3 callers served
  {
    pulses: [{ connector: 3 }],
    active: 4,
    activeTone: "emerald",
    badges: {
      cache: { text: "store", tone: "emerald" },
      queue: { text: "✓", tone: "emerald" },
      adapter: { text: "✓", tone: "emerald" },
      server: { text: "200", tone: "emerald" },
    },
    status: { text: "200 OK · 3 callers served", tone: "emerald" },
    online: true,
    duration: 1700,
  },
  // ── Story 3a: offline → 3 callers all miss cache (amber tone for misses)
  {
    pulses: [{ connector: 0 }, { connector: 0 }, { connector: 0 }],
    pulseStagger: 480,
    active: 1,
    activeTone: "amber",
    badges: {},
    dynamicBadges: [
      {
        node: "cache",
        values: [
          { text: "miss ×1", tone: "amber" },
          { text: "miss ×2", tone: "amber" },
          { text: "miss ×3", tone: "amber" },
        ],
        interval: 480,
      },
    ],
    status: { text: "offline · 3 cache misses", tone: "amber" },
    online: false,
    duration: 2000,
  },
  // ── Story 3b: 3 dots cache → queue (queue holds them, offline)
  {
    pulses: [{ connector: 1 }, { connector: 1 }, { connector: 1 }],
    pulseStagger: 480,
    active: 2,
    activeTone: "violet",
    badges: { cache: { text: "miss ×3", tone: "amber" } },
    dynamicBadges: [
      {
        node: "queue",
        values: [
          { text: "processing 1", tone: "violet" },
          { text: "processing 2", tone: "violet" },
          { text: "processing 3", tone: "violet" },
        ],
        interval: 480,
      },
    ],
    status: { text: "offline · processing 3", tone: "violet" },
    online: false,
    duration: 2000,
  },
  // ── Story 4: back online → queue drains, adapter flush count goes up
  {
    pulses: [{ connector: 2 }, { connector: 2 }, { connector: 2 }],
    pulseStagger: 600,
    active: 3,
    activeTone: "amber",
    badges: { cache: { text: "miss ×3", tone: "amber" } },
    dynamicBadges: [
      {
        node: "queue",
        values: [
          { text: "processing 3", tone: "amber" },
          { text: "processing 2", tone: "amber" },
          { text: "processing 1", tone: "amber" },
          { text: "drained ✓", tone: "emerald" },
        ],
        interval: 600,
      },
      {
        node: "adapter",
        values: [
          { text: "flush", tone: "amber" },
          { text: "flush ×1", tone: "amber" },
          { text: "flush ×2", tone: "amber" },
          { text: "flush ×3", tone: "amber" },
        ],
        interval: 600,
      },
    ],
    status: { text: "back online · flushing", tone: "amber" },
    online: true,
    duration: 2700,
  },
  // ── 3 dots adapter → server (server badge pops with each delivery)
  {
    pulses: [{ connector: 3 }, { connector: 3 }, { connector: 3 }],
    pulseStagger: 480,
    active: 4,
    activeTone: "emerald",
    badges: {
      cache: { text: "store", tone: "emerald" },
      queue: { text: "✓", tone: "emerald" },
      adapter: { text: "3×", tone: "emerald" },
    },
    dynamicBadges: [
      {
        node: "server",
        values: [
          { text: "200 ×1", tone: "emerald" },
          { text: "200 ×2", tone: "emerald" },
          { text: "200 ×3", tone: "emerald" },
        ],
        interval: 480,
      },
    ],
    status: { text: "all 3 synced ✓", tone: "emerald" },
    online: true,
    duration: 2400,
  },
];

/* ─── Component ──────────────────────────────────────────────────── */

export function RequestLifecycleAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef as React.RefObject<Element>, { amount: 0.3 });
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [dynamicIdx, setDynamicIdx] = useState(0);

  const reset = useCallback(() => setPhaseIdx(0), []);

  // Phase advance timer
  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => {
      setPhaseIdx((p) => (p + 1) % phases.length);
    }, phases[phaseIdx].duration);
    return () => clearTimeout(timer);
  }, [phaseIdx, isInView, reset]);

  // Dynamic badge cycler — uses max length & shared interval across dynamic badges
  useEffect(() => {
    setDynamicIdx(0);
    const phase = phases[phaseIdx];
    if (!phase.dynamicBadges?.length || !isInView) return;
    const maxLen = Math.max(...phase.dynamicBadges.map((d) => d.values.length));
    const { interval } = phase.dynamicBadges[0];
    let step = 0;
    const id = setInterval(() => {
      step++;
      if (step >= maxLen) {
        clearInterval(id);
        return;
      }
      setDynamicIdx(step);
    }, interval);
    return () => clearInterval(id);
  }, [phaseIdx, isInView]);

  const phase = phases[phaseIdx];
  const activeTone = toneStyles[phase.activeTone];
  const stagger = phase.pulseStagger ?? DEFAULT_STAGGER;

  const getBadge = (nodeId: string): Badge | undefined => {
    const dynamic = phase.dynamicBadges?.find((d) => d.node === nodeId);
    if (dynamic) {
      // Clamp idx to last available value if this badge is shorter than the longest
      const idx = Math.min(dynamicIdx, dynamic.values.length - 1);
      return dynamic.values[idx];
    }
    return phase.badges[nodeId];
  };

  return (
    <div ref={containerRef} className="flex h-full flex-col gap-2">
      {/* ── Pipeline ─────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden rounded-md border border-white/[0.06] bg-zinc-950/60 px-3 py-3">
        <div className="flex h-full flex-col justify-between">
          {nodes.map((node, i) => {
            const isActive = phase.active === i;
            const badge = getBadge(node.id);
            const badgeTone = badge ? toneStyles[badge.tone] : null;
            const Icon = node.icon;

            return (
              <React.Fragment key={node.id}>
                <motion.div
                  className={cn(
                    "relative flex items-center justify-between rounded-md border bg-zinc-900/80 px-2.5 py-1.5 ring-1 ring-transparent transition-colors duration-300",
                    isActive ? activeTone.border : "border-white/[0.06]",
                    isActive && activeTone.ring,
                  )}
                  animate={{
                    scale: isActive ? 1.025 : 1,
                  }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0 transition-colors",
                        isActive ? activeTone.text : "text-zinc-500",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[11px] font-medium tracking-tight truncate",
                        isActive ? "text-zinc-100" : "text-zinc-400",
                      )}
                    >
                      {node.label}
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    {badge && badgeTone && (
                      <motion.span
                        key={`${node.id}-${badge.text}`}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.18 }}
                        className={cn(
                          "ml-2 inline-flex items-center gap-1 rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider",
                          badgeTone.bg,
                          badgeTone.text,
                        )}
                      >
                        {badge.text}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Connector with one or more sequential pulses */}
                {i < nodes.length - 1 && (
                  <div className="relative flex h-3 items-center justify-center">
                    <div className="h-full w-px bg-white/[0.08]" />
                    {isInView &&
                      phase.pulses.map((pulse, pulseI) => {
                        if (pulse.connector !== i) return null;
                        const delay = (pulseI * stagger) / 1000;
                        const reverse = pulse.reverse ?? false;
                        return (
                          <motion.div
                            // eslint-disable-next-line react/no-array-index-key
                            key={`pulse-${phaseIdx}-${pulseI}`}
                            className={cn(
                              "absolute size-1.5 rounded-full",
                              activeTone.dot,
                              "shadow-[0_0_8px_currentColor]",
                            )}
                            initial={{ y: reverse ? 10 : -10, opacity: 0 }}
                            animate={{ y: reverse ? -10 : 10, opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 0.55, delay, ease: "easeInOut" }}
                          />
                        );
                      })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Status Bar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-md border border-white/[0.06] bg-zinc-950/60 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          {phase.online ? (
            <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
          ) : (
            <WifiOff className="size-3 text-rose-400" />
          )}
          <span className="text-[10px] font-medium text-zinc-500">{phase.online ? "Online" : "Offline"}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase.status.text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn("inline-flex items-center gap-1 font-mono text-[10px]", toneStyles[phase.status.tone].text)}
          >
            {phase.status.tone === "emerald" && <Check className="size-3" />}
            {phase.status.text}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
